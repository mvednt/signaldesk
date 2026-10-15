"use server";

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Human-triggered send of an outreach email (the 70+ one-click send). The
 *  caller supplies the recipient explicitly — nothing is ever auto-sent to a
 *  prospect. In Resend test mode this only delivers to the account owner's
 *  verified address; real external recipients need a verified sending domain. */
export async function sendOutreach(to: string, subject: string, body: string): Promise<SendResult> {
  const recipient = to.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) return { ok: false, error: "Enter a valid recipient email." };
  if (!subject.trim() || !body.trim()) return { ok: false, error: "Subject and body are required." };
  const key = process.env.RESEND_API_KEY;
  const from = process.env.HOTLIST_FROM_EMAIL || "onboarding@resend.dev";
  if (!key) return { ok: false, error: "RESEND_API_KEY not set." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: recipient,
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
