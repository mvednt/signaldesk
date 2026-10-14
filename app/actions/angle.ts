"use server";

import { revalidatePath } from "next/cache";
import { createReadClient } from "@/lib/supabase/read";
import { improveAngle } from "@/lib/ai/analyze";
import { GEMINI_MODEL } from "@/lib/ai/gemini";
import { insertOutreach } from "@/lib/db/writer";
import { upsertOutreachFeedback } from "@/lib/db/crm";

export type ImproveResult = { ok: true; angle: string } | { ok: false; error: string };

/** The "Improve" action: regenerate a sharper angle with Gemini, persist it as
 *  the newest outreach suggestion (system write, signal_writer), and record the
 *  'improve' rating. Returns the new angle so the UI can show it immediately. */
export async function improveOutreachAngle(
  accountId: string,
  signalEventId: string,
  currentAngle: string
): Promise<ImproveResult> {
  if (!accountId || !signalEventId) return { ok: false, error: "Missing account or signal." };
  try {
    const sb = createReadClient();
    const { data: se } = await sb
      .from("signal_events")
      .select("title, raw_excerpt")
      .eq("id", signalEventId)
      .single();
    if (!se) return { ok: false, error: "Signal not found." };
    const { data: acc } = await sb.from("accounts").select("name, industry").eq("id", accountId).single();

    const angle = await improveAngle({
      companyName: acc?.name ?? "the company",
      industry: acc?.industry,
      title: se.title,
      snippet: se.raw_excerpt,
      currentAngle,
    });

    await insertOutreach(accountId, signalEventId, angle, GEMINI_MODEL(), "improve-v1");
    await upsertOutreachFeedback(accountId, signalEventId, "improve");

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/hotlist");
    return { ok: true, angle };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
