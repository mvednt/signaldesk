// Hot List email rendering + delivery (Resend). If RESEND_API_KEY is absent the
// email is rendered but not sent (preview mode) so the flow is testable anywhere.
import type { HotListItem } from "@/lib/hotlist/select";

const CATEGORY_LABEL: Record<string, string> = {
  headcount: "Headcount", leadership: "Leadership", funding: "Funding",
  digitalisation: "Digitalisation", operational: "Operational", other: "Other",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function renderHotListEmail(items: HotListItem[], runDate: string): { subject: string; html: string; text: string } {
  const day = new Date(runDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const subject =
    items.length === 0
      ? `SignalDesk Hot List — no qualifying signals (${day})`
      : `SignalDesk Hot List — ${items.length} account${items.length > 1 ? "s" : ""} to act on (${day})`;

  const rows = items
    .map((it, i) => {
      const cat = it.category ? CATEGORY_LABEL[it.category] ?? it.category : "";
      const conf = it.confidence != null ? ` · ${Math.round(it.confidence * 100)}% confidence` : "";
      return `
      <tr><td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
        <div style="font:600 15px system-ui;color:#0f172a;">${i + 1}. ${esc(it.name)}
          <span style="font:500 11px system-ui;color:#6d28d9;background:#f3e8ff;padding:2px 8px;border-radius:10px;margin-left:6px;">${esc(it.relationship_stage ?? "")}</span>
        </div>
        <div style="font:500 12px system-ui;color:#0369a1;margin:6px 0 2px;">${esc(cat)}${conf} · ${fmtDate(it.published_at)}</div>
        <a href="${esc(it.source_url ?? "#")}" style="font:600 14px system-ui;color:#0f172a;text-decoration:none;">${esc(it.title)}</a>
        <div style="font:400 13px system-ui;color:#475569;margin-top:4px;">${esc(it.relevance_explanation ?? "")}</div>
        ${it.outreach_angle ? `<div style="font:italic 13px system-ui;color:#334155;background:#f8fafc;border-left:3px solid #0ea5e9;padding:8px 10px;margin-top:8px;border-radius:4px;">✍️ ${esc(it.outreach_angle)} <span style="font-style:normal;color:#94a3b8;font-size:10px;text-transform:uppercase;">AI-drafted</span></div>` : ""}
      </td></tr>`;
    })
    .join("");

  const body =
    items.length === 0
      ? `<p style="font:400 14px system-ui;color:#475569;">No accounts had qualifying signals in the last 3 days. Nothing to act on — we don't invent urgency.</p>`
      : `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;

  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;padding:24px;">
    <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
      <div style="font:700 20px system-ui;color:#0f172a;">SignalDesk Hot List</div>
      <div style="font:400 13px system-ui;color:#64748b;margin-top:2px;">${esc(day)} · strongest account signals from the last 3 days</div>
      <div style="margin-top:16px;">${body}</div>
      <div style="font:400 11px system-ui;color:#94a3b8;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:12px;">
        Signals are system-generated from public news. Your CRM notes are never modified. Outreach angles are AI drafts — review before sending.
      </div>
    </div></body></html>`;

  const text = items.length === 0
    ? `SignalDesk Hot List (${day})\n\nNo qualifying signals in the last 3 days.`
    : `SignalDesk Hot List (${day})\n\n` + items.map((it, i) =>
        `${i + 1}. ${it.name} [${it.relationship_stage ?? ""}] — ${it.title} (${fmtDate(it.published_at)})\n   ${it.relevance_explanation ?? ""}\n   Outreach: ${it.outreach_angle ?? "—"}`
      ).join("\n\n");

  return { subject, html, text };
}

export async function sendHotListEmail(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string
): Promise<{ sent: boolean; id?: string; error?: string; preview?: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, preview: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) return { sent: false, error: json.message ?? `HTTP ${res.status}` };
    return { sent: true, id: json.id };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
