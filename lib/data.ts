// Read-side helpers (anon client). Used by server components and the API route.
import { createReadClient } from "@/lib/supabase/read";
import type { Account } from "@/lib/types";

export async function getMonitoredAccounts(nameFilter?: string): Promise<Account[]> {
  const sb = createReadClient();
  let q = sb.from("accounts").select("*").eq("monitoring_enabled", true).order("name");
  if (nameFilter) q = q.ilike("name", `%${nameFilter}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Account[];
}

export interface DashboardRow {
  account_id: string;
  name: string;
  industry: string | null;
  hq_city: string | null;
  domain: string | null;
  relationship_stage: string | null;
  relationship_notes: string | null;
  last_contact_at: string | null;
  next_step: string | null;
  priority_override: number | null;
  score: number;
  recency_component: number | null;
  trigger_component: number | null;
  source_component: number | null;
  match_component: number | null;
  computed_at: string | null;
  top_signal_event_id: string | null;
  top_feedback: string | null;
  top_title: string | null;
  top_url: string | null;
  top_published_at: string | null;
  top_source: string | null;
  top_category: string | null;
  top_claim: string | null;
  top_relevance: string | null;
  top_confidence: number | null;
  top_outreach_angle: string | null;
  top_contact_name: string | null;
  top_contact_title: string | null;
  company_linkedin: string | null;
  company_website: string | null;
  company_phone: string | null;
  company_hq: string | null;
  company_headcount: number | null;
  escalated_at: string | null;
  escalation_draft_subject: string | null;
  escalation_draft_body: string | null;
}

export async function getDashboard(): Promise<DashboardRow[]> {
  const sb = createReadClient();
  const { data, error } = await sb.from("account_dashboard").select("*");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DashboardRow[];
  // Human priority_override wins; then system score. (Human judgment ranks above the machine.)
  return rows.sort(
    (a, b) => (b.priority_override ?? -1) - (a.priority_override ?? -1) || b.score - a.score
  );
}
