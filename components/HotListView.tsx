"use client";

import type { DashboardRow } from "@/lib/data";
import type { HotListItem } from "@/lib/hotlist/select";
import { useShell } from "./Shell";
import { OutreachBox } from "./CopyButton";
import { Card, CategoryChip, ErrorBanner, Icon, PageHeader, StageChip, fmtDate, glassStyle } from "./ui";

export default function HotListView({ items, rows, runDate, windowDays, error }: {
  items: HotListItem[]; rows: DashboardRow[]; runDate: string; windowDays: number; error: string | null;
}) {
  const { openAccount } = useShell();
  const hotIds = new Set(items.map((i) => i.account_id));
  const excluded = rows.filter((r) => r.top_title && r.score > 0 && !hotIds.has(r.account_id)).sort((a, b) => b.score - a.score);
  const n = items.length;

  return (
    <div className="flex max-w-[880px] flex-col gap-5">
      <PageHeader
        title="Hot List"
        subtitle={
          <>
            Top {n || "0"} account{n === 1 ? "" : "s"} with qualifying signals in the last {windowDays} days · emailed Mon &amp; Thu mornings
            (Asia/Kolkata) · run date {runDate}
          </>
        }
      />

      <ErrorBanner error={error} />

      {items.map((it, i) => (
        <article key={it.signal_event_id} style={glassStyle} className="glass-card sd-lift sd-rise flex flex-col gap-3.5 rounded-[22px] p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[13px] text-faint">#{i + 1}</span>
            <span className="text-[22px] font-semibold tracking-[-0.02em]">{it.name}</span>
            <StageChip stage={it.relationship_stage} />
            <span className="ml-auto text-[28px] font-semibold tabular-nums">{it.score.toFixed(0)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <CategoryChip category={it.category} />
            {it.confidence != null && <span>{Math.round(it.confidence * 100)}% confidence</span>}
            <span>· {fmtDate(it.published_at, false)}</span>
          </div>
          <a
            href={it.source_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[17px] font-medium leading-[1.4] text-ink no-underline hover:text-ember-dark hover:underline"
          >
            {it.title}
          </a>
          {it.relevance_explanation && (
            <p className="m-0 text-[14.5px] leading-[1.55] text-pretty text-ink-2">{it.relevance_explanation}</p>
          )}
          {it.outreach_angle && (
            <OutreachBox
              text={it.outreach_angle}
              accountId={it.account_id}
              signalEventId={it.signal_event_id}
              initialRating={it.feedback}
            />
          )}
          {it.contact_name && (
            <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
              <Icon name="person" size={15} />
              <span>
                Reach: <span className="font-medium text-ink">{it.contact_name}</span>
                {it.contact_title ? `, ${it.contact_title}` : ""}
              </span>
              <a
                href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${it.contact_name} ${it.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 font-medium text-ember-dark no-underline hover:underline"
              >
                on LinkedIn <Icon name="arrow_outward" size={14} />
              </a>
            </div>
          )}
          <button
            onClick={() => openAccount(it.account_id)}
            className="flex cursor-pointer items-center gap-1 self-start border-0 bg-transparent p-0 text-sm font-medium text-ember-dark"
          >
            Open account <Icon name="arrow_forward" size={18} />
          </button>
        </article>
      ))}

      {!error && n < 10 && (
        <div className="rounded-[18px] border-[1.5px] border-dashed border-line px-5 py-[18px] text-sm leading-[1.55] text-pretty text-muted">
          {n === 0
            ? `No accounts have a qualifying signal in the last ${windowDays} days.`
            : `Only ${n} account${n === 1 ? "" : "s"} qualified in the last ${windowDays} days.`}{" "}
          The Hot List shows fewer than 10, or none, rather than inventing urgency.
        </div>
      )}

      {excluded.length > 0 && (
        <Card className="gap-2.5">
          <h2 className="m-0 text-[17px] font-semibold">Outside the {windowDays}-day window</h2>
          {excluded.map((r) => (
            <button
              key={r.account_id}
              onClick={() => openAccount(r.account_id)}
              className="flex cursor-pointer items-center justify-between gap-3 border-0 border-t border-line bg-transparent px-1 py-3 text-left hover:bg-paper"
            >
              <span className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-[15px] font-medium">{r.name}</span>
                <span className="truncate text-[13px] text-muted">{r.top_title}</span>
              </span>
              <span className="whitespace-nowrap text-[13px] text-muted">
                {fmtDate(r.top_published_at, false)} · score {r.score.toFixed(0)}
              </span>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
