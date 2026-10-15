"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DashboardRow } from "@/lib/data";
import { useShell } from "./Shell";
import { StageFilter } from "./Dashboard";
import { Avatar, ErrorBanner, Icon, PageHeader, StageChip, fmtDate, glassStyle, matchesQuery, stagesOf } from "./ui";

const COLS = "grid-cols-[minmax(180px,1.2fr)_100px_minmax(220px,2fr)_110px_minmax(160px,1.2fr)_80px]";

export default function AccountsTable({ rows, error }: { rows: DashboardRow[]; error: string | null }) {
  const { query, openAccount, selectedId, userName } = useShell();
  const [stage, setStage] = useState("all");
  const [warmOnly, setWarmOnly] = useState(useSearchParams().get("view") === "warm");
  const filtered = rows.filter(
    (r) => (stage === "all" || r.relationship_stage === stage) && (!warmOnly || r.score > 0) && matchesQuery(r, query),
  );

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle={warmOnly ? "Warm this cycle — scored above 0." : "Human priority wins, then system score."}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setWarmOnly((v) => !v)}
            className={`h-8 cursor-pointer rounded-full border-[1.5px] px-[13px] text-[13px] font-medium ${
              warmOnly ? "border-ember bg-ember text-white" : "border-chip bg-transparent text-ink-2 hover:border-ink"
            }`}
          >
            Warm only
          </button>
          <StageFilter stages={stagesOf(rows)} value={stage} onChange={setStage} />
        </div>
      </PageHeader>

      <ErrorBanner error={error} />

      <div style={glassStyle} className="glass-card sd-rise overflow-x-auto rounded-[22px] px-3.5 py-2">
        <div className="min-w-[860px]">
          <div className={`grid ${COLS} gap-4 px-2 py-3.5 text-[11px] font-medium tracking-[0.08em] text-faint`}>
            <span>ACCOUNT</span>
            <span>STAGE</span>
            <span className="text-human-ink">{`${userName}'s notes`.toUpperCase()}</span>
            <span>LAST CONTACT</span>
            <span>NEXT STEP</span>
            <span className="text-right">SCORE</span>
          </div>
          {filtered.map((r) => (
            <button
              key={r.account_id}
              onClick={() => openAccount(r.account_id)}
              className={`grid w-full ${COLS} cursor-pointer items-center gap-4 rounded-[10px] border-0 border-t border-line px-2 py-3.5 text-left hover:bg-paper ${
                selectedId === r.account_id ? "bg-ember-soft" : "bg-transparent"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={r.name} size={36} />
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[14.5px] font-medium">{r.name}</span>
                    {r.escalated_at && (
                      <span title="Auto-escalated via n8n" className="flex items-center rounded-full bg-ember-soft px-1.5 py-[3px] text-ember-ink">
                        <Icon name="bolt" size={12} />
                      </span>
                    )}
                  </span>
                  <span className="text-[12.5px] text-muted">{[r.industry, r.hq_city].filter(Boolean).join(" · ")}</span>
                </span>
              </span>
              <span><StageChip stage={r.relationship_stage} /></span>
              <span className="text-[13.5px] leading-[1.45] text-pretty text-ink-2">{r.relationship_notes ?? "—"}</span>
              <span className="text-[13.5px] text-ink-2">{fmtDate(r.last_contact_at)}</span>
              <span className="text-[13.5px] text-ink-2">{r.next_step ?? "—"}</span>
              <span className={`text-right text-[17px] font-semibold tabular-nums ${r.score > 0 ? "text-ink" : "text-faint"}`}>
                {r.score.toFixed(0)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && <div className="border-t border-line px-2 py-7 text-sm text-muted">No accounts match.</div>}
        </div>
      </div>
    </>
  );
}
