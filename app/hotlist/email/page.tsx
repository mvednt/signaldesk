import { getDashboard, type DashboardRow } from "@/lib/data";
import { getHotList, runDateInTZ, type HotListItem } from "@/lib/hotlist/select";
import { renderHotListEmail } from "@/lib/notifications/email";
import Shell from "@/components/Shell";
import EmailPreview from "@/components/EmailPreview";

export const dynamic = "force-dynamic";

export default async function EmailPreviewPage() {
  let rows: DashboardRow[] = [];
  let items: HotListItem[] = [];
  let error: string | null = null;
  const runDate = runDateInTZ();
  try {
    [rows, items] = await Promise.all([getDashboard(), getHotList(3)]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const { subject } = renderHotListEmail(items, runDate);
  const to = process.env.HOTLIST_TO_EMAIL ?? "arjun@yourcompany.com";
  const from = process.env.HOTLIST_FROM_EMAIL ?? "SignalDesk <hotlist@signaldesk.app>";

  return (
    <Shell rows={rows} hotCount={items.length}>
      <EmailPreview items={items} runDate={runDate} subject={subject} to={to} from={from} error={error} />
    </Shell>
  );
}
