// Hot List selection — strict N-day window (default 3) via the get_hotlist RPC.
// Read-only (anon). Returns at most 10; fewer when fewer qualify. Never invents.
import { createReadClient } from "@/lib/supabase/read";

export interface HotListItem {
  account_id: string;
  name: string;
  relationship_stage: string | null;
  score: number;
  signal_event_id: string;
  title: string;
  source_url: string | null;
  published_at: string | null;
  category: string | null;
  relevance_explanation: string | null;
  confidence: number | null;
  outreach_angle: string | null;
  feedback: string | null;
  contact_name: string | null;
  contact_title: string | null;
}

export async function getHotList(days = 3): Promise<HotListItem[]> {
  const sb = createReadClient();
  const { data, error } = await sb.rpc("get_hotlist", { p_days: days });
  if (error) throw new Error(error.message);
  return (data ?? []) as HotListItem[];
}

/** YYYY-MM-DD in the configured app timezone (default Asia/Kolkata). */
export function runDateInTZ(tz = process.env.APP_TIMEZONE || "Asia/Kolkata"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
