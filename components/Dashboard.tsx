"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DashboardRow } from "@/lib/data";
import type { HotListItem } from "@/lib/hotlist/select";
import { useShell } from "./Shell";
import Countdown from "./Countdown";
import { Avatar, CATEGORY_LABEL, Card, CardTitle, ErrorBanner, Icon, PageHeader, StageChip, cap, fmtDate, glassStyle, matchesQuery, stagesOf } from "./ui";

export default function Dashboard({ rows, hot, error }: { rows: DashboardRow[]; hot: HotListItem[]; error: string | null }) {
  const { query, openAccount, selectedId, userName } = useShell();
  const [stage, setStage] = useState<string>("all");

  const warm = rows.filter((r) => r.score > 0);
  const top = useMemo(() => [...rows].sort((a, b) => b.score - a.score).find((r) => r.score > 0 && r.top_title) ?? null, [rows]);
  const stages = stagesOf(rows);
  const filtered = rows.filter((r) => (stage === "all" || r.relationship_stage === stage) && matchesQuery(r, query));
  const bars = [...rows].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(40, ...rows.map((r) => r.score));
  const maxStage = Math.max(1, ...stages.map((s) => rows.filter((r) => r.relationship_stage === s).length));
  const warmPct = rows.length ? Math.round((warm.length / rows.length) * 100) : 0;

  return (
    <>
      <PageHeader title="Overview" subtitle="Which accounts should you contact right now, what happened, and what should you say.">
        <Link
          href="/hotlist/email"
          className="sd-press flex h-12 items-center gap-2 rounded-full bg-panel pl-[18px] pr-[22px] text-[15px] font-medium text-white no-underline hover:bg-[#2a2d34]"
        >
          <Icon name="mail" />
          Preview email
        </Link>
        <Link
          href="/hotlist"
          className="sd-press flex h-12 items-center rounded-full border-[1.5px] border-ink px-[22px] text-[15px] font-medium text-ink no-underline hover:bg-surface"
        >
          Open Hot List
        </Link>
      </PageHeader>

      <ErrorBanner error={error} />

      <div className="sd-stagger grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        <Kpi href="/accounts" dark label="Accounts monitored" value={rows.length} foot="Monitoring on for every account" />
        <Kpi href="/accounts?view=warm" label="Warm this cycle" value={warm.length} foot="Score above 0 · 30-day decay" />
        <Kpi href="/hotlist" label="On the Hot List" value={hot.length} foot="Qualifying in the last 3 days" />
        <Kpi
          onClick={top ? () => openAccount(top.account_id) : undefined}
          label="Top signal score"
          value={top ? Number(top.score.toFixed(0)) : 0}
          foot={top?.name ?? "No warm accounts"}
          footAccent
        />
      </div>

      <div className="sd-stagger flex flex-wrap gap-4">
        <Card className="flex-[2_1_520px] gap-[18px]">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <CardTitle>Signal score by account</CardTitle>
            <span className="text-[12.5px] text-muted">Strongest qualifying signal · 0–100</span>
          </div>
          <div className="flex h-[250px] items-end gap-2.5">
            {bars.map((r, i) => {
              const isWarm = r.score > 0;
              const isTop = i === 0 && isWarm;
              const h = isWarm ? Math.round(56 + (r.score / maxScore) * 140) : 46;
              const bg = isWarm
                ? r.score >= 30 ? "var(--ink)" : r.score >= 20 ? "#e2552b" : "#f2a385"
                : "repeating-linear-gradient(-45deg,var(--chip) 0 3px,transparent 3px 8px)";
              return (
                <button
                  key={r.account_id}
                  onClick={() => openAccount(r.account_id)}
                  title={`${r.name} · ${r.score.toFixed(0)}`}
                  className="flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-end gap-2 border-0 bg-transparent p-0"
                >
                  <span
                    className={`rounded-full px-[7px] py-0.5 font-mono text-[11.5px] font-semibold ${
                      isTop ? "bg-ember text-white" : isWarm ? "text-ink" : "text-faint"
                    }`}
                  >
                    {r.score.toFixed(0)}
                  </span>
                  <span
                    className="w-full max-w-[58px] rounded-full transition-[height] duration-500"
                    style={{ height: h, background: bg, outline: selectedId === r.account_id ? "2px solid #e2552b" : "none", outlineOffset: 3 }}
                  />
                  <span className="max-w-full truncate text-xs text-muted">{r.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="flex-[1_1_280px] gap-3.5">
          <CardTitle>Contact first</CardTitle>
          {top ? (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-ember-dark">{top.name}</div>
                <div className="text-[13.5px] text-muted">
                  {[top.top_category && (CATEGORY_LABEL[top.top_category] ?? top.top_category), fmtDate(top.top_published_at, false),
                    top.top_confidence != null && `${Math.round(top.top_confidence * 100)}% confidence`].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="text-[14.5px] leading-normal text-pretty text-ink-2">{top.top_title}</div>
              <div className="flex-1" />
              <button
                onClick={() => openAccount(top.account_id)}
                className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-ember text-[15.5px] font-medium text-white hover:bg-[#c9461f]"
              >
                <Icon name="edit_note" />
                See outreach angle
              </button>
            </>
          ) : (
            <p className="m-0 text-sm text-muted">No account has a qualifying signal this cycle.</p>
          )}
        </Card>

        <Card className="flex-[1_1_260px] gap-3.5">
          <div className="flex items-center justify-between">
            <CardTitle>Pipeline</CardTitle>
            <span className="text-xs font-medium text-human-ink">{`${userName}'s stages`}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {stages.map((s) => {
              const all = rows.filter((r) => r.relationship_stage === s);
              const w = all.filter((r) => r.score > 0).length;
              return (
                <button
                  key={s}
                  onClick={() => setStage(stage === s ? "all" : s)}
                  className={`flex cursor-pointer flex-col gap-2 rounded-[14px] border-0 px-3 py-2.5 text-left hover:bg-human-soft ${stage === s ? "bg-human-soft" : "bg-transparent"}`}
                >
                  <div className="flex items-center justify-between text-[14.5px]">
                    <span className="font-medium">{cap(s)}</span>
                    <span className="font-mono text-[13px] text-muted">{all.length} · {w} warm</span>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-track">
                    <span className="bg-ember" style={{ width: `${(w / maxStage) * 100}%` }} />
                    <span className="bg-human/50" style={{ width: `${((all.length - w) / maxStage) * 100}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <Card className="flex-[2_1_560px] gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Ranked accounts</CardTitle>
            <StageFilter stages={stages} value={stage} onChange={setStage} />
          </div>
          <div className="flex flex-col">
            {filtered.map((r) => (
              <button
                key={r.account_id}
                onClick={() => openAccount(r.account_id)}
                className={`grid cursor-pointer grid-cols-[28px_44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border-0 border-t border-line px-2 py-3 text-left hover:bg-paper ${
                  selectedId === r.account_id ? "bg-ember-soft" : "bg-transparent"
                }`}
              >
                <span className="font-mono text-xs text-faint">#{rows.indexOf(r) + 1}</span>
                <Avatar name={r.name} />
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15.5px] font-medium">{r.name}</span>
                    <StageChip stage={r.relationship_stage} />
                    {r.escalated_at && (
                      <span title="Auto-escalated via n8n" className="flex items-center gap-0.5 rounded-full bg-ember-soft px-2 py-0.5 text-[10.5px] font-semibold text-ember-ink">
                        <Icon name="bolt" size={12} /> Escalated
                      </span>
                    )}
                  </span>
                  <span className={`truncate text-[13px] ${r.top_title ? "text-ink-2" : "text-faint"}`}>
                    {r.top_title ?? "No fresh qualifying signals this cycle."}
                  </span>
                </span>
                <span className="flex min-w-16 flex-col items-end gap-[5px]">
                  <span className="text-lg font-semibold tabular-nums">{r.score.toFixed(0)}</span>
                  <span className="flex h-[5px] w-16 overflow-hidden rounded-full bg-track">
                    <span
                      style={{
                        width: `${Math.min(100, r.score * 2.5)}%`,
                        background: r.score >= 20 ? "#e2552b" : r.score > 0 ? "#f0a07f" : "var(--chip)",
                      }}
                    />
                  </span>
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="border-t border-line px-2 py-7 text-sm text-muted">No accounts match{query ? ` “${query}”` : ""}.</div>
            )}
          </div>
        </Card>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Card className="gap-1.5">
            <CardTitle>Portfolio warmth</CardTitle>
            <div className="relative flex justify-center pt-1.5">
              <svg viewBox="0 0 240 130" className="w-full max-w-[280px]">
                <path d="M 24 116 A 96 96 0 0 1 216 116" fill="none" stroke="var(--track)" strokeWidth="26" strokeLinecap="round" />
                <path
                  d="M 24 116 A 96 96 0 0 1 216 116"
                  fill="none"
                  stroke="#e2552b"
                  strokeWidth="26"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${warmPct} 100`}
                />
              </svg>
              <div className="absolute inset-x-0 bottom-0.5 flex flex-col items-center">
                <span className="text-[44px] font-semibold leading-none tracking-[-0.04em]">{warmPct}%</span>
                <span className="text-[13px] text-muted">warm this cycle</span>
              </div>
            </div>
            <div className="flex justify-center gap-5 pt-2.5 text-[13px] text-ink-2">
              <span className="flex items-center gap-[7px]"><span className="h-2.5 w-2.5 rounded-full bg-ember" />Warm {warm.length}</span>
              <span className="flex items-center gap-[7px]"><span className="h-2.5 w-2.5 rounded-full bg-chip" />Quiet {rows.length - warm.length}</span>
            </div>
          </Card>

          <section className="flex min-h-[220px] flex-1 flex-col gap-3 rounded-[22px] bg-[radial-gradient(130%_100%_at_0%_100%,#5a2414_0%,#15171c_62%)] p-[22px] text-white">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-[19px] font-medium">Next Hot List</h2>
              <span className="flex items-center gap-1.5 text-xs text-[#f2a385]">
                <span className="h-[7px] w-[7px] rounded-full bg-[#f08a63] [animation:sd-pulse_1.6s_infinite]" />
                scheduled
              </span>
            </div>
            <Countdown />
            <div className="flex-1" />
            <a
              href="/api/hotlist?format=html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-white text-[14.5px] font-medium text-[#15171c] no-underline hover:bg-[#f4d9ce]"
            >
              <Icon name="mail" />
              Preview this run
            </a>
          </section>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, foot, dark, footAccent, href, onClick }: {
  label: string; value: number; foot: string; dark?: boolean; footAccent?: boolean; href?: string; onClick?: () => void;
}) {
  const cls = `sd-press sd-lift flex min-h-[176px] flex-col justify-between rounded-[22px] p-[22px] text-left no-underline ${
    dark
      ? "bg-[radial-gradient(120%_90%_at_100%_0%,#5a2414_0%,#15171c_60%)] text-white shadow-[0_22px_50px_-28px_rgba(21,23,28,.6)]"
      : "glass-card text-ink hover:shadow-[inset_0_0_0_1.5px_#15171c,0_30px_66px_-32px_rgba(21,23,28,.4)]"
  }`;
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-base font-medium">{label}</span>
        <span className={`flex h-[38px] w-[38px] items-center justify-center rounded-full ${dark ? "bg-white text-[#15171c]" : "border-[1.5px] border-ink"}`}>
          <Icon name="north_east" />
        </span>
      </div>
      <div className="text-[56px] font-semibold leading-none tracking-[-0.04em]">{value}</div>
      <div className={`text-[13px] ${dark ? "text-[#f2a385]" : footAccent ? "font-medium text-ember-dark" : "text-muted"}`}>{foot}</div>
    </>
  );
  const style = dark ? undefined : glassStyle;
  if (href) return <Link href={href} style={style} className={cls}>{body}</Link>;
  return <button onClick={onClick} style={style} className={`${cls} cursor-pointer border-0`}>{body}</button>;
}

export function StageFilter({ stages, value, onChange }: { stages: string[]; value: string; onChange: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {["all", ...stages].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`h-8 cursor-pointer rounded-full border-[1.5px] px-[13px] text-[13px] font-medium ${
            value === s ? "border-panel bg-panel text-white" : "border-chip bg-transparent text-ink-2 hover:border-ink"
          }`}
        >
          {s === "all" ? "All" : cap(s)}
        </button>
      ))}
    </div>
  );
}
