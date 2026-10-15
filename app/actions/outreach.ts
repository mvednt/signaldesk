"use server";

import { getSessionUser } from "@/lib/auth/session";

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Human-triggered send of an outreach email (the 70+ one-click send). The
 *  caller supplies the recipient explicitly — nothing is ever auto-sent to a
 *  prospect. Delivery still goes through Resend from the verified sending
 *  address; the signed-in user's Google email is attached as Reply-To (and as
 *  the sender display name) so prospect replies land in THEIR inbox. */
export async function sendOutreach(to: string, subject: string, body: string): Promise<SendResult> {
  const recipient = to.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) return { ok: false, error: "Enter a valid recipient email." };
  if (!subject.trim() || !body.trim()) return { ok: false, error: "Subject and body are required." };
  const key = process.env.RESEND_API_KEY;
  const fromAddress = process.env.HOTLIST_FROM_EMAIL || "onboarding@resend.dev";
  if (!key) return { ok: false, error: "RESEND_API_KEY not set." };

  // Identity of the signed-in sender (Google). Delivery is unchanged — this
  // only sets who the recipient sees and replies to.
  const sender = await getSessionUser();
  const from = sender?.name ? `${sender.name} <${fromAddress}>` : fromAddress;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: recipient,
        ...(sender?.email ? { reply_to: sender.email } : {}),
        subject,
        text: body,
        html: `<pre style="font:400 14px/1.6 system-ui;white-space:pre-wrap;margin:0;">${esc(body)}</pre>`,
      }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: json.message ?? `HTTP ${res.status}` };
    return { ok: true, id: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
