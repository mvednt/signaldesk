"use server";

import { revalidatePath } from "next/cache";
import { updateScoringConfig } from "@/lib/db/crm";
import { recomputeAllScores } from "@/lib/scoring/recompute";
import type { ScoringConfig } from "@/lib/scoring/config";

export type SaveScoringResult = { ok: true; accounts: number } | { ok: false; error: string };

const CATS = ["leadership", "headcount", "digitalisation", "funding", "operational", "other"] as const;
const SRCS = ["newsapi", "google_news_rss", "manual"] as const;
const w = (v: number) => Number.isFinite(v) && v >= 0 && v <= 1;

/** Save the scoring rubric, then re-rank every account from stored signals so the
 *  dashboard reflects it immediately. Writes config as crm_writer; recompute as
 *  signal_writer — the two restricted roles, never crossing. */
export async function saveScoringConfig(cfg: ScoringConfig): Promise<SaveScoringResult> {
  // Validate: category/source weights in [0,1]; thresholds sane.
  for (const c of CATS) if (!w(cfg.category_weights[c])) return { ok: false, error: `Category weight "${c}" must be between 0 and 1.` };
  for (const s of SRCS) if (!w(cfg.source_weights[s])) return { ok: false, error: `Source weight "${s}" must be between 0 and 1.` };
  if (!(cfg.decay_days >= 1 && cfg.decay_days <= 365)) return { ok: false, error: "Decay days must be 1–365." };
  if (!w(cfg.match_threshold)) return { ok: false, error: "Match threshold must be between 0 and 1." };
  if (!(cfg.escalate_threshold >= 0 && cfg.escalate_threshold <= 100)) return { ok: false, error: "Escalate threshold must be 0–100." };
  if (!(cfg.send_tier >= 0 && cfg.send_tier <= 100)) return { ok: false, error: "Send tier must be 0–100." };

  try {
    await updateScoringConfig(cfg);
    const { accounts } = await recomputeAllScores(cfg);
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/hotlist");
    revalidatePath("/settings");
    return { ok: true, accounts };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
