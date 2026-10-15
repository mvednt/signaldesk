import { getDashboard, type DashboardRow } from "@/lib/data";
import { getHotList, type HotListItem } from "@/lib/hotlist/select";
import { getScoringConfig } from "@/lib/scoring/config";
import Shell from "@/components/Shell";
import ScoringSettings from "@/components/ScoringSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let rows: DashboardRow[] = [];
  let hot: HotListItem[] = [];
  const cfg = await getScoringConfig();
  try {
    [rows, hot] = await Promise.all([getDashboard(), getHotList(3)]);
  } catch {}

  return (
    <Shell rows={rows} hotCount={hot.length}>
      <ScoringSettings initial={cfg} />
    </Shell>
  );
}
