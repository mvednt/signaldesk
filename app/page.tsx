import { getDashboard, type DashboardRow } from "@/lib/data";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  headcount: "Headcount",
  leadership: "Leadership",
  funding: "Funding",
  digitalisation: "Digitalisation",
  operational: "Operational",
  other: "Other",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function scoreTone(score: number): string {
  if (score >= 50) return "bg-emerald-500";
  if (score >= 20) return "bg-amber-500";
  if (score > 0) return "bg-slate-400";
  return "bg-slate-200 dark:bg-slate-700";
}

export default async function Home() {
  let rows: DashboardRow[] = [];
  let error: string | null = null;
  try {
    rows = await getDashboard();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const warm = rows.filter((r) => r.score > 0).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">SignalDesk</h1>
        <p className="mt-1 text-sm text-slate-500">
          B2B account signal intelligence · {rows.length} accounts monitored · {warm} warm this cycle
        </p>
        <p className="mt-3 text-xs text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-500 align-middle" /> system-derived &nbsp;·&nbsp;
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500 align-middle" /> Arjun&apos;s own (never overwritten)
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Could not load dashboard: {error}
        </div>
      )}

      <div className="space-y-4">
        {rows.map((r, i) => (
          <article
            key={r.account_id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">#{i + 1}</span>
                  <h2 className="text-lg font-semibold">{r.name}</h2>
                  {r.relationship_stage && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      {r.relationship_stage}
                    </span>
                  )}
                  {r.priority_override != null && (
                    <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium text-white">
                      pinned P{r.priority_override}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.industry}
                  {r.hq_city ? ` · ${r.hq_city}` : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tabular-nums">{r.score.toFixed(0)}</div>
                <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full ${scoreTone(r.score)}`} style={{ width: `${Math.min(100, r.score)}%` }} />
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">signal score</div>
              </div>
            </div>

            {/* System-derived signal */}
            {r.top_title ? (
              <div className="mt-4 rounded-lg border-l-2 border-sky-500 bg-sky-50/50 p-3 dark:bg-sky-950/20">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {r.top_category && (
                    <span className="rounded bg-sky-100 px-1.5 py-0.5 font-medium text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                      {CATEGORY_LABEL[r.top_category] ?? r.top_category}
                    </span>
                  )}
                  <span className="text-slate-400">{fmtDate(r.top_published_at)}</span>
                  {r.top_confidence != null && (
                    <span className="text-slate-400">· {(r.top_confidence * 100).toFixed(0)}% confidence</span>
                  )}
                  <span className="text-slate-400">· {r.top_source}</span>
                </div>
                <a
                  href={r.top_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm font-medium text-slate-900 hover:underline dark:text-slate-100"
                >
                  {r.top_title}
                </a>
                {r.top_relevance && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.top_relevance}</p>}
                {r.top_outreach_angle && (
                  <p className="mt-2 rounded bg-white p-2 text-sm italic text-slate-700 ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                    ✍️ {r.top_outreach_angle}
                    <span className="ml-1 not-italic text-[10px] uppercase tracking-wide text-slate-400">AI-drafted</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No fresh qualifying signals this cycle.</p>
            )}

            {/* Human-owned context */}
            <div className="mt-3 border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800">
              <span className="font-medium text-violet-600 dark:text-violet-400">Arjun&apos;s notes:</span>{" "}
              {r.relationship_notes ?? "—"}
              <span className="ml-2 text-slate-400">· last contact {fmtDate(r.last_contact_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
