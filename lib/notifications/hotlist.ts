// Hot List run orchestrator. Preview mode needs no credentials; send mode
// records an idempotent run (one email per run date) and delivers via Resend.
import { getHotList, runDateInTZ, type HotListItem } from "@/lib/hotlist/select";
import { renderHotListEmail, sendHotListEmail } from "@/lib/notifications/email";
import { claimNotificationRun, finalizeNotificationRun } from "@/lib/db/writer";

export interface HotListResult {
  runDate: string;
  count: number;
  items: HotListItem[];
  subject: string;
  sent: boolean;
  status: "preview" | "sent" | "skipped" | "failed";
  reason?: string;
  error?: string;
}

export async function runHotList(opts: { send: boolean; days?: number }): Promise<HotListResult> {
  const days = opts.days ?? 3;
  const runDate = runDateInTZ();
  const items = await getHotList(days);
  const { subject, html, text } = renderHotListEmail(items, runDate);

  if (!opts.send) {
    return { runDate, count: items.length, items, subject, sent: false, status: "preview" };
  }

  const to = process.env.HOTLIST_TO_EMAIL;
  const from = process.env.HOTLIST_FROM_EMAIL || "onboarding@resend.dev";
  if (!to) return { runDate, count: items.length, items, subject, sent: false, status: "failed", error: "HOTLIST_TO_EMAIL not set" };

  // Idempotency: one email per (run_date, kind). If already sent, skip.
  const claim = await claimNotificationRun(runDate, "hotlist");
  if (!claim.claimed && claim.existingStatus === "sent") {
    return { runDate, count: items.length, items, subject, sent: false, status: "skipped", reason: "already sent for this run date" };
  }

  const res = await sendHotListEmail(to, from, subject, html, text);
  const status: HotListResult["status"] = res.sent ? "sent" : res.preview ? "skipped" : "failed";
  await finalizeNotificationRun(runDate, "hotlist", res.sent ? "sent" : res.preview ? "skipped" : "failed", to, items, res.error ?? null);
  return { runDate, count: items.length, items, subject, sent: res.sent, status, reason: res.preview ? "RESEND_API_KEY not set" : undefined, error: res.error };
}
