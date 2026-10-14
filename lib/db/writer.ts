// System-owned writes ONLY, performed as the restricted `signal_writer` Postgres
// role (SIGNAL_WRITER_DATABASE_URL). This role has NO privileges on human-owned
// tables, so the preservation guarantee holds even if this code is buggy.
// Every write uses an EXPLICIT column list (allowlist) — never a blind upsert of
// a whole object — as defense-in-depth.
import { Pool } from "pg";
import { requireServerEnv } from "@/lib/env";
import type { Analysis, NormalizedSignal, ScoreComponents } from "@/lib/types";

let _pool: Pool | null = null;

function pool(): Pool {
  const { signalWriterUrl } = requireServerEnv();
  if (!signalWriterUrl) {
    throw new Error(
      "SIGNAL_WRITER_DATABASE_URL is not set. Set the signal_writer role password " +
        "in Supabase (Database → Roles) and paste the Transaction-pooler connection " +
        "string into .env.local to enable system writes."
    );
  }
  _pool ??= new Pool({ connectionString: signalWriterUrl, max: 3, ssl: { rejectUnauthorized: false } });
  return _pool;
}

export async function startIngestionRun(trigger: "manual" | "cron"): Promise<string> {
  const { rows } = await pool().query(
    `insert into ingestion_runs (trigger, status) values ($1, 'running') returning id`,
    [trigger]
  );
  return rows[0].id;
}

export async function finishIngestionRun(
  runId: string,
  status: "success" | "partial" | "failed",
  counts: { accounts_scanned: number; signals_found: number; signals_new: number },
  errors: unknown[]
): Promise<void> {
  await pool().query(
    `update ingestion_runs
       set finished_at = now(), status = $2,
           accounts_scanned = $3, signals_found = $4, signals_new = $5, errors = $6
     where id = $1`,
    [runId, status, counts.accounts_scanned, counts.signals_found, counts.signals_new, JSON.stringify(errors)]
  );
}

/** Idempotent on content_hash. Returns the event id and whether it was new. */
export async function insertSignalEvent(
  accountId: string,
  s: NormalizedSignal
): Promise<{ id: string; inserted: boolean }> {
  const ins = await pool().query(
    `insert into signal_events
       (account_id, source, source_url, title, raw_excerpt, published_at, content_hash, status)
     values ($1,$2,$3,$4,$5,$6,$7,'new')
     on conflict (content_hash) do nothing
     returning id`,
    [accountId, s.source, s.url, s.cleanTitle, s.snippet, s.publishedAt, s.contentHash]
  );
  if (ins.rows[0]) return { id: ins.rows[0].id, inserted: true };
  const existing = await pool().query(`select id from signal_events where content_hash = $1`, [s.contentHash]);
  return { id: existing.rows[0].id, inserted: false };
}

export async function insertAnalysis(signalEventId: string, a: Analysis, model: string, promptVersion: string): Promise<void> {
  await pool().query(
    `insert into signal_analyses
       (signal_event_id, category, factual_claim, relevance_explanation, confidence, is_relevant, model, prompt_version,
        contact_name, contact_title)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (signal_event_id) do update set
       category = excluded.category, factual_claim = excluded.factual_claim,
       relevance_explanation = excluded.relevance_explanation, confidence = excluded.confidence,
       is_relevant = excluded.is_relevant, model = excluded.model, prompt_version = excluded.prompt_version,
       contact_name = excluded.contact_name, contact_title = excluded.contact_title`,
    [
      signalEventId, a.category, a.factual_claim, a.relevance_explanation, a.confidence, a.is_relevant, model, promptVersion,
      a.contact_name?.trim() || null, a.contact_title?.trim() || null,
    ]
  );
  await pool().query(`update signal_events set status = 'analyzed' where id = $1`, [signalEventId]);
}

/** Company enrichment ("where to reach"). System-derived — written as signal_writer. */
export async function upsertAccountContact(
  accountId: string,
  c: { company_linkedin: string | null; website: string | null; phone: string | null; hq: string | null; headcount: number | null }
): Promise<void> {
  await pool().query(
    `insert into account_contacts
       (account_id, company_linkedin, website, phone, hq, headcount, source, fetched_at)
     values ($1,$2,$3,$4,$5,$6,'apollo', now())
     on conflict (account_id) do update set
       company_linkedin = excluded.company_linkedin, website = excluded.website,
       phone = excluded.phone, hq = excluded.hq, headcount = excluded.headcount,
       source = 'apollo', fetched_at = now()`,
    [accountId, c.company_linkedin, c.website, c.phone, c.hq, c.headcount]
  );
}

export async function insertOutreach(
  accountId: string,
  signalEventId: string,
  angle: string,
  model: string,
  promptVersion: string
): Promise<void> {
  await pool().query(
    `insert into outreach_suggestions (account_id, signal_event_id, angle_text, model, prompt_version, is_generated)
     values ($1,$2,$3,$4,$5,true)`,
    [accountId, signalEventId, angle, model, promptVersion]
  );
}

export async function upsertScore(accountId: string, c: ScoreComponents, topSignalEventId: string | null): Promise<void> {
  await pool().query(
    `insert into account_signal_scores
       (account_id, score, recency_component, trigger_component, source_component, match_component, top_signal_event_id, computed_at)
     values ($1,$2,$3,$4,$5,$6,$7, now())
     on conflict (account_id) do update set
       score = excluded.score, recency_component = excluded.recency_component,
       trigger_component = excluded.trigger_component, source_component = excluded.source_component,
       match_component = excluded.match_component, top_signal_event_id = excluded.top_signal_event_id,
       computed_at = now()`,
    [accountId, c.score, c.recency, c.trigger, c.source, c.match, topSignalEventId]
  );
}

/** Idempotent claim for a Hot List run. Returns whether THIS call created the
 *  run row (claimed=true) or it already existed (with its current status). */
export async function claimNotificationRun(
  runDate: string,
  kind = "hotlist"
): Promise<{ claimed: boolean; existingStatus: string | null }> {
  const ins = await pool().query(
    `insert into notification_runs (run_date, kind, status) values ($1,$2,'pending')
     on conflict (run_date, kind) do nothing returning id`,
    [runDate, kind]
  );
  if (ins.rows[0]) return { claimed: true, existingStatus: null };
  const ex = await pool().query(`select status from notification_runs where run_date=$1 and kind=$2`, [runDate, kind]);
  return { claimed: false, existingStatus: ex.rows[0]?.status ?? null };
}

export async function finalizeNotificationRun(
  runDate: string,
  kind: string,
  status: "sent" | "failed" | "skipped",
  sentTo: string | null,
  hotlist: unknown,
  error: string | null
): Promise<void> {
  await pool().query(
    `update notification_runs set status=$3, sent_to=$4, hotlist=$5, error=$6 where run_date=$1 and kind=$2`,
    [runDate, kind, status, sentTo, JSON.stringify(hotlist ?? null), error]
  );
}

/** Claim an escalation for a triggering signal. Returns inserted=true only the
 *  first time, so the webhook fires once per top signal. */
export async function claimEscalation(
  accountId: string,
  signalEventId: string,
  score: number
): Promise<{ inserted: boolean }> {
  const ins = await pool().query(
    `insert into account_escalations (account_id, signal_event_id, score, status)
     values ($1,$2,$3,'sent')
     on conflict (signal_event_id) do nothing
     returning id`,
    [accountId, signalEventId, score]
  );
  return { inserted: ins.rows.length > 0 };
}

export async function finalizeEscalation(signalEventId: string, status: "sent" | "failed", response: string): Promise<void> {
  await pool().query(
    `update account_escalations set status=$2, webhook_response=$3 where signal_event_id=$1`,
    [signalEventId, status, response.slice(0, 1000)]
  );
}

export async function endPool(): Promise<void> {
  if (_pool) { await _pool.end(); _pool = null; }
}
