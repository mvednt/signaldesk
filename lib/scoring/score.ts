// Deterministic scoring. NO LLM here — fully explainable and calibratable.
// score = 100 · recency · trigger · source · match · aiConfidence, taken from an
// account's STRONGEST qualifying signal. The weights/windows come from the live
// rubric (`ScoringConfig`, editable on the website); DEFAULT_SCORING_CONFIG is the
// fallback. As signals age, recency → 0, so quiet accounts decay automatically.
import type { Analysis, NormalizedSignal, ScoreComponents } from "@/lib/types";
import { categoryWeight, sourceWeight, type ScoringConfig } from "@/lib/scoring/config";

/** Linear decay to 0 over `decayDays` (the standing-warmth window; the Hot List
 *  uses a separate strict 3-day window). */
export function recencyWeight(publishedAt: string | null, decayDays: number, now = Date.now()): number {
  if (!publishedAt) return 0;
  const t = Date.parse(publishedAt);
  if (Number.isNaN(t)) return 0;
  const days = (now - t) / 864e5;
  if (days <= 0) return 1;
  if (days >= decayDays) return 0;
  return 1 - days / decayDays;
}

export interface ScoredSignal {
  signal: NormalizedSignal;
  analysis: Analysis;
  matchConfidence: number;
  components: ScoreComponents;
}

export function scoreSignal(
  signal: NormalizedSignal,
  analysis: Analysis,
  matchConfidence: number,
  cfg: ScoringConfig,
  now = Date.now()
): ScoreComponents {
  const recency = recencyWeight(signal.publishedAt, cfg.decay_days, now);
  const trigger = categoryWeight(cfg, analysis.category);
  const source = sourceWeight(cfg, signal.source);
  const match = matchConfidence;
  const score = analysis.is_relevant
    ? 100 * recency * trigger * source * match * analysis.confidence
    : 0;
  return {
    score: round(score),
    recency: round(recency),
    trigger: round(trigger),
    source: round(source),
    match: round(match),
    topContentHash: signal.contentHash,
  };
}

/** Account score = its strongest signal. Returns null if nothing qualifies. */
export function scoreAccount(scored: ScoredSignal[]): ScoreComponents | null {
  const relevant = scored.filter((s) => s.analysis.is_relevant && s.components.score > 0);
  if (relevant.length === 0) return null;
  return relevant.reduce((best, s) => (s.components.score > best.score ? s.components : best), relevant[0].components);
}

export const round = (n: number) => Math.round(n * 100) / 100;
