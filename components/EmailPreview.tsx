"use client";

import Link from "next/link";
import type { DashboardRow } from "@/lib/data";
import type { HotListItem } from "@/lib/hotlist/select";
import { useShell } from "./Shell";
import { OutreachBox } from "./CopyButton";
import { CategoryChip, ErrorBanner, Icon, PageHeader, StageChip, fmtDate, glassStyle } from "./ui";

export default function EmailPreview({ items, runDate, subject, to, from, error }: {
  items: HotListItem[]; runDate: string; subject: string; to: string; from: string; error: string | null;
}) {
  const { openAccount } = useShell();
  const day = new Date(runDate + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Email preview"
        subtitle={<>Exactly what lands in your inbox every Mon &amp; Thu morning (Asia/Kolkata) · run date {runDate}</>}
      >
        <a
          href="/api/hotlist?format=html"
          target="_blank"
          rel="noopener noreferrer"
          className="sd-press flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink px-[18px] text-[14px] font-medium text-ink no-underline hover:bg-white"
        >
          <Icon name="code" size={19} />
          View raw HTML
        </a>
        <Link
          href="/hotlist"
          className="sd-press flex h-11 items-center rounded-full bg-ink px-[18px] text-[14px] font-medium text-white no-underline hover:bg-[#2a2d34]"
        >
          Open Hot List
        </Link>
      </PageHeader>

      <ErrorBanner error={error} />

      <div style={glassStyle} className="glass-card sd-rise mx-auto flex w-full max-w-[720px] flex-col overflow-hidden rounded-[26px]">
        <div className="flex flex-col gap-1.5 border-b border-line/80 bg-white/40 px-6 py-5 font-mono text-[12.5px] text-muted sm:px-8">
          <div className="flex gap-2"><span className="w-12 shrink-0 text-faint">From</span><span className="text-ink-2">{from}</span></div>
          <div className="flex gap-2"><span className="w-12 shrink-0 text-faint">To</span><span className="text-ink-2">{to}</span></div>
          <div className="flex gap-2"><span className="w-12 shrink-0 text-faint">Subj</span><span className="font-medium text-ink">{subject}</span></div>
        </div>

        <div className="flex flex-col gap-5 px-6 py-7 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-ember shadow-[0_8px_22px_-8px_rgba(226,85,43,.8)]">
              <svg width="38" height="38" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                <circle cx="13" cy="21" r="3" fill="#fff" />
                <path d="M20 21A7 7 0 0 0 13 14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M24 21A11 11 0 0 0 13 10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[19px] font-semibold tracking-[-0.015em]">SignalDesk Hot List</span>
              <span className="text-[13px] text-muted">{day} · strongest account signals from the last 3 days</span>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="m-0 rounded-2xl bg-white/60 p-5 text-[14.5px] leading-[1.6] text-ink-2">
              No accounts had qualifying signals in the last 3 days. Nothing to act on — we don&apos;t invent urgency.
            </p>
          ) : (
            <div className="sd-stagger flex flex-col gap-4">
              {items.map((it, i) => (
                <article key={it.signal_event_id} className="sd-lift flex flex-col gap-3 rounded-[20px] bg-white/70 p-5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-[13px] text-faint">#{i + 1}</span>
                    <span className="text-[18px] font-semibold tracking-[-0.015em]">{it.name}</span>
                    <StageChip stage={it.relationship_stage} />
                    <span className="ml-auto text-[22px] font-semibold tabular-nums">{it.score.toFixed(0)}</span>
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
                    className="text-[16px] font-medium leading-[1.4] text-ink no-underline hover:text-ember-dark hover:underline"
                  >
                    {it.title}
                  </a>
                  {it.relevance_explanation && (
                    <p className="m-0 text-[14px] leading-[1.55] text-pretty text-ink-2">{it.relevance_explanation}</p>
                  )}
                  {it.outreach_angle && <OutreachBox text={it.outreach_angle} />}
                  <button
                    onClick={() => openAccount(it.account_id)}
                    className="sd-press flex cursor-pointer items-center gap-1 self-start border-0 bg-transparent p-0 text-sm font-medium text-ember-dark"
                  >
                    Open account <Icon name="arrow_forward" size={18} />
                  </button>
                </article>
              ))}
            </div>
          )}

          <p className="m-0 border-t border-line/80 pt-4 text-[12px] leading-[1.55] text-faint">
            Signals are system-generated from public news. Your CRM notes are never modified. Outreach angles are AI drafts — review before sending.
          </p>
        </div>
      </div>
    </div>
  );
}
