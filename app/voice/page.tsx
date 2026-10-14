import { getDashboard, type DashboardRow } from "@/lib/data";
import { getHotList, type HotListItem } from "@/lib/hotlist/select";
import { createReadClient } from "@/lib/supabase/read";
import { DEFAULT_VOICE } from "@/lib/voice";
import type { VoiceFields } from "@/lib/db/crm";
import Shell from "@/components/Shell";
import VoiceEditor from "@/components/VoiceEditor";

export const dynamic = "force-dynamic";

async function getVoice(): Promise<VoiceFields> {
  try {
    const sb = createReadClient();
    const { data } = await sb.from("company_voice").select("*").eq("id", "default").single();
    const v = data as Partial<VoiceFields> | null;
    if (v) {
      return {
        company_name: v.company_name ?? "",
        product: v.product ?? "",
        value_prop: v.value_prop ?? "",
        audience: v.audience ?? "",
        tone: v.tone ?? "",
        sender_name: v.sender_name ?? "",
        signoff: v.signoff ?? "",
        guidelines: v.guidelines ?? "",
      };
    }
  } catch {}
  return {
    company_name: DEFAULT_VOICE.company_name,
    product: DEFAULT_VOICE.product,
    value_prop: DEFAULT_VOICE.value_prop,
    audience: DEFAULT_VOICE.audience ?? "",
    tone: DEFAULT_VOICE.tone,
    sender_name: DEFAULT_VOICE.sender_name,
    signoff: DEFAULT_VOICE.signoff ?? "",
    guidelines: DEFAULT_VOICE.guidelines ?? "",
  };
}

export default async function VoicePage() {
  let rows: DashboardRow[] = [];
  let hot: HotListItem[] = [];
  const voice: VoiceFields = await getVoice();
  try {
    [rows, hot] = await Promise.all([getDashboard(), getHotList(3)]);
  } catch {}

  return (
    <Shell rows={rows} hotCount={hot.length}>
      <VoiceEditor initial={voice} />
    </Shell>
  );
}
