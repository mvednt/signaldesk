// Auto-escalation webhook. When an account crosses the score threshold, POST
// the lead to n8n, which emails Arjun a hot-lead alert. No human confirmation
// on the escalation itself; the PROSPECT outreach stays staged for Arjun (we
// never auto-send to the real person). Returns ok/fail, never throws.
import { requireServerEnv } from "@/lib/env";

export interface EscalationPayload {
  account: string;
  domain: string | null;
  score: number;
  threshold: number;
  person_name: string | null;
  person_title: string | null;
  linkedin_search_url: string | null;
  outreach_angle: string | null;
  signal_title: string;
  signal_url: string | null;
  arjun_email: string;
  dashboard_url: string;
}

export function linkedinSearchUrl(company: string, person?: string | null): string {
  const q = person ? `${person} ${company}` : `operations OR people ${company}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
}

export async function fireEscalation(
  payload: EscalationPayload
): Promise<{ ok: boolean; response: string }> {
  const { n8nWebhookUrl } = requireServerEnv();
  if (!n8nWebhookUrl) return { ok: false, response: "N8N_WEBHOOK_URL not set" };
  try {
    const res = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = (await res.text()).slice(0, 500);
    return { ok: res.ok, response: text };
  } catch (e) {
    return { ok: false, response: e instanceof Error ? e.message : String(e) };
  }
}
