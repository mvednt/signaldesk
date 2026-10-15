// Re-score every account from its STORED signals using a given rubric, without a
// fresh news scan. This is what the "recompute" on the settings page calls, so a
// rubric change re-ranks the dashboard instantly. Reads via the anon client;
// writes account_signal_scores as signal_writer (same system-owned path as ingest).
import "server-only";
import { createReadClient } from "@/lib/supabase/read";
import { upsertScore } from "@/lib/db/writer";
import { recencyWeight, round } from "@/lib/scoring/score";
import { categoryWeight, sourceWeight, type ScoringConfig } from "@/lib/scoring/config";

interface Row {
  signal_event_id: string;
  category: string | null;
  confidence: number | null;
  match_confidence: number | null;
  signal_events: { account_id: string; source: string | null; published_at: string | null } | null;
}

export async function recomputeAllScores(cfg: ScoringConfig): Promise<{ accounts: number }> {
  const sb = createReadClient();
  const { data, error } = await sb
    .from("signal_analyses")
    .select("signal_event_id, category, confidence, match_confidence, signal_events(account_id, source, published_at)")
    .eq("is_relevant", true);
  if (error) throw new Error(error.message);

  const now = Date.now();
  type Best = { score: number; recency: number; trigger: number; source: number; match: number; eventId: string };
  const best = new Map<string, Best>();

  for (const r of (data ?? []) as unknown as Row[]) {
    const se = r.signal_events;
    if (!se?.account_id) continue;
    const recency = recencyWeight(se.published_at, cfg.decay_days, now);
    const trigger = categoryWeight(cfg, r.category);
    const source = sourceWeight(cfg, se.source);
    const match = r.match_confidence != null ? Number(r.match_confidence) : 0.8; // fallback for un-backfilled rows
    const conf = Number(r.confidence) || 0;
    const score = 100 * recency * trigger * source * match * conf;
    const prev = best.get(se.account_id);
    if (!prev || score > prev.score) {
      best.set(se.account_id, { score, recency, trigger, source, match, eventId: r.signal_event_id });
    }
  }

  // Every account that has relevant signals gets rewritten; a top that now scores
  // 0 (e.g. a weight set to 0, or a shortened decay window) is stored as 0/no-top.
  for (const [accountId, b] of best) {
    const positive = b.score > 0;
    await upsertScore(
      accountId,
      {
        score: round(b.score),
        recency: positive ? round(b.recency) : 0,
        trigger: positive ? round(b.trigger) : 0,
        source: positive ? round(b.source) : 0,
        match: positive ? round(b.match) : 0,
        topContentHash: null,
      },
      positive ? b.eventId : null
    );
  }

  return { accounts: best.size };
}
