// Deterministic scoring. NO LLM here — fully explainable and calibratable.
// score = 100 · recency · trigger · source · match · aiConfidence, taken from an
// account's STRONGEST qualifying signal. As signals age, recency → 0, so quiet
// accounts decay automatically (human CRM fields are never touched).
import type { Analysis, NormalizedSignal, ScoreComponents, SignalCategory, SignalSource } from "@/lib/types";

// Standing "account warmth" decays to 0 over this window (calibratable via env).
// This is deliberately LONGER than the 3-day Hot List window: the Hot List is a
// strict twice-weekly alert, while the dashboard score reflects recent momentum.
export const DECAY_DAYS = Number(process.env.SIGNAL_DECAY_DAYS) || 30;

const CATEGORY_WEIGHT: Record<SignalCategory, number> = {
  leadership: 1.0, // new CHRO / VP Ops — highest intent
  headcount: 0.9,
  digitalisation: 0.75,
  funding: 0.7,
  operational: 0.6,
  other: 0.3,
};

const SOURCE_WEIGHT: Record<SignalSource, number> = {
  newsapi: 0.85,
  google_news_rss: 0.8,
  manual: 0.7,
};

export function recencyWeight(publishedAt: string | null, now = Date.now()): number {
  if (!publishedAt) return 0;
  const t = Date.parse(publishedAt);
  if (Number.isNaN(t)) return 0;
  const days = (now - t) / 864e5;
  if (days <= 0) return 1;
  if (days >= DECAY_DAYS) return 0;
  return 1 - days / DECAY_DAYS;
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
  now = Date.now()
): ScoreComponents {
  const recency = recencyWeight(signal.publishedAt, now);
  const trigger = CATEGORY_WEIGHT[analysis.category] ?? 0.3;
  const source = SOURCE_WEIGHT[signal.source] ?? 0.7;
  const match = matchConfidence;
  const score = analysis.is_relevant
    ? 100 * recency * trigger * source * match * analysis.confidence
    : 0;
  return {
    score: Math.round(score * 100) / 100,
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

const round = (n: number) => Math.round(n * 100) / 100;
