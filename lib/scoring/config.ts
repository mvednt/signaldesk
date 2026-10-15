// The scoring rubric — editable from the website (table `scoring_config`), with
// the original hardcoded values as the fallback. Loaded fresh (not memoized) so a
// save + recompute always uses the latest numbers.
import type { SignalCategory, SignalSource } from "@/lib/types";
import { createReadClient } from "@/lib/supabase/read";

export interface ScoringConfig {
  category_weights: Record<SignalCategory, number>;
  source_weights: Record<SignalSource, number>;
  decay_days: number;
  match_threshold: number;
  escalate_threshold: number;
  send_tier: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  category_weights: { leadership: 1.0, headcount: 0.9, digitalisation: 0.75, funding: 0.7, operational: 0.6, other: 0.3 },
  source_weights: { newsapi: 0.85, google_news_rss: 0.8, manual: 0.7 },
  decay_days: 30,
  match_threshold: 0.6,
  escalate_threshold: 60,
  send_tier: 70,
};

export function categoryWeight(cfg: ScoringConfig, c: SignalCategory | string | null): number {
  const v = c ? cfg.category_weights[c as SignalCategory] : undefined;
  return v ?? DEFAULT_SCORING_CONFIG.category_weights.other;
}
export function sourceWeight(cfg: ScoringConfig, s: SignalSource | string | null): number {
  const v = s ? cfg.source_weights[s as SignalSource] : undefined;
  return v ?? DEFAULT_SCORING_CONFIG.source_weights.manual;
}

/** Read the live rubric, merged over the defaults (so a missing column never breaks scoring). */
export async function getScoringConfig(): Promise<ScoringConfig> {
  try {
    const sb = createReadClient();
    const { data } = await sb.from("scoring_config").select("*").eq("id", "default").single();
    if (!data) return DEFAULT_SCORING_CONFIG;
    const d = data as Record<string, unknown>;
    return {
      category_weights: { ...DEFAULT_SCORING_CONFIG.category_weights, ...(d.category_weights as object) },
      source_weights: { ...DEFAULT_SCORING_CONFIG.source_weights, ...(d.source_weights as object) },
      decay_days: num(d.decay_days, DEFAULT_SCORING_CONFIG.decay_days),
      match_threshold: num(d.match_threshold, DEFAULT_SCORING_CONFIG.match_threshold),
      escalate_threshold: num(d.escalate_threshold, DEFAULT_SCORING_CONFIG.escalate_threshold),
      send_tier: num(d.send_tier, DEFAULT_SCORING_CONFIG.send_tier),
    };
  } catch {
    return DEFAULT_SCORING_CONFIG;
  }
}

const num = (v: unknown, fallback: number) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
