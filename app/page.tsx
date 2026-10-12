import { getDashboard, type DashboardRow } from "@/lib/data";
import { getHotList, type HotListItem } from "@/lib/hotlist/select";
import Shell from "@/components/Shell";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  let rows: DashboardRow[] = [];
  let hot: HotListItem[] = [];
  let error: string | null = null;
  try {
    [rows, hot] = await Promise.all([getDashboard(), getHotList(3)]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <Shell rows={rows} hotCount={hot.length}>
      <Dashboard rows={rows} hot={hot} error={error} />
    </Shell>
  );
}
