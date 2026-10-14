// Company voice persona — loaded once per process, injected into every AI
// outreach prompt so all drafts stay on-voice. Falls back to a sensible default
// if the row is missing.
import { createReadClient } from "@/lib/supabase/read";

export interface CompanyVoice {
  company_name: string;
  product: string;
  value_prop: string;
  audience: string | null;
  tone: string;
  sender_name: string;
  signoff: string | null;
  guidelines: string | null;
}

export const DEFAULT_VOICE: CompanyVoice = {
  company_name: "WorkforceOS",
  product: "a workforce-management platform (shift scheduling, attendance, frontline operations, compliance)",
  value_prop: "keeps frontline labor efficient and compliant as operations scale",
  audience: "COOs, VPs of Operations and CHROs at scaling companies in India",
  tone: "warm, concise, consultative; specific over salesy; no buzzwords",
  sender_name: "Arjun",
  signoff: "Arjun · WorkforceOS",
  guidelines: "Open on the trigger, one concrete value point, one low-friction ask, under ~90 words.",
};

let _voicePromise: Promise<CompanyVoice> | null = null;
export async function getCompanyVoice(): Promise<CompanyVoice> {
  _voicePromise ??= (async () => {
    try {
      const sb = createReadClient();
      const { data } = await sb.from("company_voice").select("*").eq("id", "default").single();
      return (data as CompanyVoice) ?? DEFAULT_VOICE;
    } catch {
      return DEFAULT_VOICE;
    }
  })();
  return _voicePromise;
}

/** Prompt block describing the company voice, shared by every outreach prompt. */
export function voiceBlock(v: CompanyVoice): string {
  return [
    "COMPANY VOICE — write as this company, in this voice, every time:",
    `  Company: ${v.company_name}`,
    `  Product: ${v.product}`,
    `  Value: ${v.value_prop}`,
    v.audience ? `  Audience: ${v.audience}` : "",
    `  Tone: ${v.tone}`,
    `  Sender: ${v.sender_name}`,
    v.signoff ? `  Sign-off: ${v.signoff}` : "",
    v.guidelines ? `  Rules: ${v.guidelines}` : "",
  ].filter(Boolean).join("\n");
}
