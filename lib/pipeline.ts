// Ingestion orchestrator. `computeAccountSignals` is pure (no DB) so it can be
// tested in isolation; `persistAccountResults` does the system-owned writes.
import type { Account, NormalizedSignal } from "@/lib/types";
import { fetchAllSources } from "@/lib/ingestion/sources";
import { normalizeAll } from "@/lib/ingestion/normalize";
import { matchAccount, MATCH_THRESHOLD } from "@/lib/ingestion/match";
import { analyzeSignal, draftOutreach, PROMPT_VERSION } from "@/lib/ai/analyze";
import { GEMINI_MODEL } from "@/lib/ai/gemini";
import { scoreSignal, scoreAccount, type ScoredSignal } from "@/lib/scoring/score";
import {
  insertSignalEvent, insertAnalysis, insertOutreach, upsertScore,
  startIngestionRun, finishIngestionRun, upsertAccountContact,
  claimEscalation, finalizeEscalation,
} from "@/lib/db/writer";
import { enrichOrganization } from "@/lib/ingestion/apollo";
import { fireEscalation, linkedinSearchUrl } from "@/lib/notifications/escalate";
import { requireServerEnv } from "@/lib/env";

const DASHBOARD_URL = process.env.APP_PUBLIC_URL || "https://signaldesk-vedanth3.vercel.app";

export interface ComputeResult {
  account: Account;
  rawCount: number;
  normalizedCount: number;
  matchedCount: number;
  analyzed: ScoredSignal[];
  topContentHash: string | null;
}

const MAX_ANALYZE = 6; // bound Gemini calls per account per run

export async function computeAccountSignals(account: Account): Promise<ComputeResult> {
  const raws = await fetchAllSources(account);
  const normalized = normalizeAll(raws);

  const matched = normalized
    .map((s) => ({ s, m: matchAccount(account, s) }))
    .filter(({ m }) => m.confidence >= MATCH_THRESHOLD);

  // Analyze the most-recent matched items (no hard age cutoff — the scoring's
  // recency decay handles age so quiet/old accounts fall in rank naturally).
  const recent = matched
    .sort((a, b) => Date.parse(b.s.publishedAt ?? "0") - Date.parse(a.s.publishedAt ?? "0"))
    .slice(0, MAX_ANALYZE);

  const analyzed: ScoredSignal[] = [];
  for (const { s, m } of recent) {
    const analysis = await analyzeSignal(account, s);
    const components = scoreSignal(s, analysis, m.confidence);
    analyzed.push({ signal: s, analysis, matchConfidence: m.confidence, components });
  }

  const top = scoreAccount(analyzed);
  return {
    account,
    rawCount: raws.length,
    normalizedCount: normalized.length,
    matchedCount: matched.length,
    analyzed,
    topContentHash: top?.topContentHash ?? null,
  };
}

export async function persistAccountResults(r: ComputeResult): Promise<{ newEvents: number }> {
  const model = GEMINI_MODEL();
  const hashToEventId = new Map<string, string>();
  let newEvents = 0;

  for (const sc of r.analyzed) {
    const { id, inserted } = await insertSignalEvent(r.account.id, sc.signal);
    hashToEventId.set(sc.signal.contentHash, id);
    if (inserted) newEvents++;
    await insertAnalysis(id, sc.analysis, model, PROMPT_VERSION);
    if (sc.analysis.is_relevant && sc.analysis.outreach_angle.trim()) {
      await insertOutreach(r.account.id, id, sc.analysis.outreach_angle, model, PROMPT_VERSION);
    }
  }

  const top = scoreAccount(r.analyzed);
  const topEventId = top?.topContentHash ? hashToEventId.get(top.topContentHash) ?? null : null;
  await upsertScore(
    r.account.id,
    top ?? { score: 0, recency: 0, trigger: 0, source: 0, match: 0, topContentHash: null },
    topEventId
  );

  // "Where to reach": for warm accounts (a real trigger), enrich the company
  // via Apollo. Gated to warm accounts to spare API credits; the PERSON to
  // reach comes from Gemini (contact_name/title on the analysis), not Apollo.
  if (top && top.score > 0 && r.account.domain) {
    const contact = await enrichOrganization(r.account.domain);
    if (contact) await upsertAccountContact(r.account.id, contact);
  }

  // Auto-escalation: a very hot lead (score >= threshold) fires the n8n webhook
  // ONCE per triggering signal (claimEscalation is idempotent). No human
  // confirmation. The prospect outreach stays staged — n8n emails Arjun only.
  const { escalateThreshold, hotlistToEmail } = requireServerEnv();
  if (top && topEventId && top.score >= escalateThreshold) {
    const { inserted } = await claimEscalation(r.account.id, topEventId, top.score);
    if (inserted) {
      const topSc = r.analyzed.find((s) => s.components.topContentHash === top.topContentHash);
      const person = topSc?.analysis.contact_name?.trim() || null;
      const signalTitle = topSc?.signal.cleanTitle ?? "";
      // Auto-draft the outreach in the company voice (shown to Arjun, staged).
      let draft = { subject: "", body: "" };
      try {
        draft = await draftOutreach({
          company: r.account.name,
          person,
          personTitle: topSc?.analysis.contact_title?.trim() || null,
          signalTitle,
          angle: topSc?.analysis.outreach_angle ?? null,
        });
      } catch { /* draft is best-effort */ }
      const { ok, response } = await fireEscalation({
        account: r.account.name,
        domain: r.account.domain ?? null,
        score: top.score,
        threshold: escalateThreshold,
        person_name: person,
        person_title: topSc?.analysis.contact_title?.trim() || null,
        linkedin_search_url: linkedinSearchUrl(r.account.name, person),
        outreach_angle: topSc?.analysis.outreach_angle ?? null,
        signal_title: signalTitle,
        signal_url: topSc?.signal.url ?? null,
        arjun_email: hotlistToEmail,
        dashboard_url: DASHBOARD_URL,
        draft_subject: draft.subject,
        draft_body: draft.body,
      });
      await finalizeEscalation(topEventId, ok ? "sent" : "failed", response, draft);
    }
  }
  return { newEvents };
}

export async function runIngestion(accounts: Account[], trigger: "manual" | "cron") {
  const runId = await startIngestionRun(trigger);
  const errors: Array<{ account: string; error: string }> = [];
  let signalsFound = 0, signalsNew = 0, scanned = 0;

  for (const account of accounts) {
    scanned++;
    try {
      const computed = await computeAccountSignals(account);
      signalsFound += computed.normalizedCount;
      const { newEvents } = await persistAccountResults(computed);
      signalsNew += newEvents;
    } catch (e) {
      errors.push({ account: account.name, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const status = errors.length === 0 ? "success" : errors.length < accounts.length ? "partial" : "failed";
  await finishIngestionRun(runId, status, { accounts_scanned: scanned, signals_found: signalsFound, signals_new: signalsNew }, errors);
  return { runId, status, scanned, signalsFound, signalsNew, errors };
}
