import { getDashboard, type DashboardRow } from "@/lib/data";
import { getHotList, runDateInTZ, type HotListItem } from "@/lib/hotlist/select";
import Shell from "@/components/Shell";
import HotListView from "@/components/HotListView";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 3;

export default async function HotListPage() {
  let rows: DashboardRow[] = [];
  let items: HotListItem[] = [];
  let error: string | null = null;
  try {
    [rows, items] = await Promise.all([getDashboard(), getHotList(WINDOW_DAYS)]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <Shell rows={rows} hotCount={items.length}>
      <HotListView items={items} rows={rows} runDate={runDateInTZ()} windowDays={WINDOW_DAYS} error={error} />
    </Shell>
  );
}
