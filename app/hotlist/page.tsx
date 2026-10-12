import Link from "next/link";
import { getHotList, runDateInTZ, type HotListItem } from "@/lib/hotlist/select";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  headcount: "Headcount", leadership: "Leadership", funding: "Funding",
  digitalisation: "Digitalisation", operational: "Operational", other: "Other",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function HotListPage() {
  let items: HotListItem[] = [];
  let error: string | null = null;
  try {
    items = await getHotList(3);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const runDate = runDateInTZ();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-2 text-sm">
        <Link href="/" className="text-sky-600 hover:underline">← Dashboard</Link>
      </div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hot List</h1>
        <p className="mt-1 text-sm text-slate-500">
          Top {items.length || "0"} account{items.length === 1 ? "" : "s"} with qualifying signals in the last 3 days ·
          emailed Mon &amp; Thu mornings (Asia/Kolkata) · run date {runDate}
        </p>
      </header>

      {error && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!error && items.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          No accounts have a qualifying signal in the last 3 days. The Hot List shows fewer than 10 — or none —
          rather than inventing urgency.
        </div>
      )}

      <ol className="space-y-4">
        {items.map((it, i) => (
          <li key={it.signal_event_id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">#{i + 1}</span>
              <h2 className="font-semibold">{it.name}</h2>
              {it.relationship_stage && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">{it.relationship_stage}</span>
              )}
              <span className="ml-auto text-sm font-semibold tabular-nums">{it.score.toFixed(0)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {it.category && <span className="rounded bg-sky-100 px-1.5 py-0.5 font-medium text-sky-700 dark:bg-sky-900 dark:text-sky-300">{CATEGORY_LABEL[it.category] ?? it.category}</span>}
              {it.confidence != null && <span>{Math.round(it.confidence * 100)}% confidence</span>}
              <span>· {fmtDate(it.published_at)}</span>
            </div>
            <a href={it.source_url ?? "#"} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-medium hover:underline">{it.title}</a>
            {it.relevance_explanation && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{it.relevance_explanation}</p>}
            {it.outreach_angle && (
              <p className="mt-2 rounded bg-slate-50 p-2 text-sm italic text-slate-700 ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                ✍️ {it.outreach_angle} <span className="not-italic text-[10px] uppercase tracking-wide text-slate-400">AI-drafted</span>
              </p>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
