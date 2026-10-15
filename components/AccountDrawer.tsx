"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DashboardRow } from "@/lib/data";
import { saveRelationshipNotes } from "@/app/actions/crm";
import { Avatar, CategoryChip, Icon, SOURCE_LABEL, StageChip, fmtDate } from "./ui";
import { OutreachBox } from "./CopyButton";
import { ReachBox } from "./ReachBox";
import EscalationOutreach from "./EscalationOutreach";
import { useShell } from "./Shell";

const MAX_NOTES = 4000;

export default function AccountDrawer({ row: r, onClose }: { row: DashboardRow; onClose: () => void }) {
  const router = useRouter();
  const { userName } = useShell();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState<string | null>(r.relationship_notes ?? null);
  const [draft, setDraft] = useState(r.relationship_notes ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveNotes = () => {
    startTransition(async () => {
      const res = await saveRelationshipNotes(r.account_id, draft);
      if (res.ok) {
        setNotes(draft.trim() === "" ? null : draft);
        setEditing(false);
        setSaveError(null);
        router.refresh();
      } else {
        setSaveError(res.error);
      }
    });
  };

  const comps: [string, number | null][] = [
    ["Recency", r.recency_component],
    ["Trigger", r.trigger_component],
    ["Source", r.source_component],
    ["Match", r.match_component],
    ["Confidence", r.top_confidence],
  ];

  return (
    <>
      <div onClick={onClose} className="sd-fade fixed inset-0 z-40 bg-panel/50 backdrop-blur-[3px]" style={{ animation: "sd-fade .25s ease both" }} />
      <aside
        role="dialog"
        aria-label={r.name}
        className="sd-drawer fixed bottom-3 right-3 top-3 z-41 flex w-[min(480px,calc(100vw-24px))] flex-col overflow-y-auto rounded-3xl bg-surface/90 shadow-[0_30px_80px_rgba(21,23,28,.25)] backdrop-blur-2xl"
      >
        <div className="flex items-start gap-3.5 border-b border-line px-6 pb-[18px] pt-6">
          <Avatar name={r.name} size={52} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="text-2xl font-semibold tracking-[-0.025em]">{r.name}</div>
            <div className="text-[13.5px] text-muted">
              {[r.industry, r.hq_city, r.domain].filter(Boolean).join(" · ")}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-paper hover:bg-track"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 border-b border-line px-6 py-[22px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-[7px] text-xs font-medium text-ember-ink">
              <span className="h-2 w-2 rounded-full bg-ember" />
              SYSTEM-DERIVED
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[34px] font-semibold tabular-nums tracking-[-0.03em]">{r.score.toFixed(0)}</span>
              <span className="text-xs text-muted">signal score</span>
            </span>
          </div>

          {r.escalated_at && (
            <div className="flex items-center gap-2 rounded-xl bg-ember-soft px-3.5 py-2.5 text-[12.5px] font-medium text-ember-ink">
              <Icon name="bolt" size={17} />
              Auto-escalated · {userName} alerted via n8n to reach out now
            </div>
          )}

          {r.top_title ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                <CategoryChip category={r.top_category} />
                <span>{fmtDate(r.top_published_at)}</span>
                {r.top_confidence != null && <span>· {(r.top_confidence * 100).toFixed(0)}% confidence</span>}
                {r.top_source && <span>· {SOURCE_LABEL[r.top_source] ?? r.top_source}</span>}
              </div>
              <a
                href={r.top_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[16.5px] font-medium leading-[1.4] text-ink no-underline hover:text-ember-dark hover:underline"
              >
                {r.top_title}
              </a>
              {r.top_relevance && <p className="m-0 text-[14.5px] leading-[1.55] text-pretty text-ink-2">{r.top_relevance}</p>}
              {r.top_outreach_angle && (
                <OutreachBox
                  text={r.top_outreach_angle}
                  accountId={r.account_id}
                  signalEventId={r.top_signal_event_id}
                  initialRating={r.top_feedback}
                />
              )}
              <ReachBox
                companyName={r.name}
                contactName={r.top_contact_name}
                contactTitle={r.top_contact_title}
                companyLinkedin={r.company_linkedin}
                companyWebsite={r.company_website}
                companyPhone={r.company_phone}
                companyHq={r.company_hq}
                companyHeadcount={r.company_headcount}
              />
              {r.escalation_draft_subject && r.escalation_draft_body && (
                <EscalationOutreach
                  subject={r.escalation_draft_subject}
                  body={r.escalation_draft_body}
                  score={r.score}
                />
              )}

              <div className="flex flex-col gap-2.5 pt-1">
                <div className="text-[11px] font-medium tracking-[0.08em] text-faint">WHY THIS SCORE</div>
                {comps.map(([label, v]) => (
                  <div key={label} className="grid grid-cols-[96px_minmax(0,1fr)_40px] items-center gap-3 text-[13px]">
                    <span className="text-ink-2">{label}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-track">
                      <span className="block h-full bg-ink" style={{ width: `${Math.min(100, (v ?? 0) * 100)}%` }} />
                    </span>
                    <span className="text-right font-mono text-xs text-muted">{v != null ? v.toFixed(2) : "—"}</span>
                  </div>
                ))}
                <div className="font-mono text-xs text-faint">100 × recency × trigger × source × match × confidence</div>
              </div>
            </>
          ) : (
            <p className="m-0 text-[14.5px] leading-normal text-muted">
              No fresh qualifying signals this cycle. The score decays to 0 when nothing new qualifies.
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3.5 bg-human-soft px-6 py-[22px]">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-[7px] text-xs font-medium text-human-ink">
              <span className="h-2 w-2 rounded-full bg-human" />
              {`${userName}'s own`.toUpperCase()} · NEVER OVERWRITTEN
            </span>
            {!editing && (
              <button
                onClick={() => { setDraft(notes ?? ""); setSaveError(null); setEditing(true); }}
                className="sd-press flex items-center gap-1 rounded-full border-[1.5px] border-human-ink/40 px-2.5 py-1 text-[12px] font-medium text-human-ink hover:bg-human/10"
              >
                <Icon name="edit" size={15} /> Edit notes
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <StageChip stage={r.relationship_stage} />
            {r.priority_override != null && (
              <span className="rounded-full bg-human-ink px-2 py-0.5 text-xs font-medium text-white">pinned P{r.priority_override}</span>
            )}
          </div>
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                autoFocus
                maxLength={MAX_NOTES}
                placeholder="Add your notes on this relationship…"
                className="w-full resize-y rounded-[14px] border-[1.5px] border-human-ink/30 bg-surface px-3.5 py-3 text-[14.5px] leading-[1.5] text-ink outline-none placeholder:text-faint focus:border-human-ink"
              />
              {saveError && <span className="text-[12.5px] font-medium text-ember-ink">{saveError}</span>}
              <div className="flex items-center gap-2">
                <button
                  onClick={saveNotes}
                  disabled={isPending}
                  className="sd-press flex h-9 items-center gap-1.5 rounded-full border-0 bg-human px-4 text-[13.5px] font-medium text-white disabled:opacity-60"
                >
                  <Icon name={isPending ? "progress_activity" : "check"} size={16} className={isPending ? "animate-spin" : ""} />
                  {isPending ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => { setEditing(false); setSaveError(null); }}
                  disabled={isPending}
                  className="sd-press h-9 cursor-pointer rounded-full border-0 bg-transparent px-3 text-[13.5px] font-medium text-muted hover:bg-human/10 disabled:opacity-60"
                >
                  Cancel
                </button>
                <span className="ml-auto font-mono text-[11.5px] text-faint tabular-nums">{draft.length}/{MAX_NOTES}</span>
              </div>
            </div>
          ) : (
            <p className="m-0 text-[14.5px] leading-[1.55] text-pretty text-ink-2">{notes ?? "—"}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-[14px] bg-surface px-3.5 py-3">
              <span className="text-xs text-muted">Last contact</span>
              <span className="text-[14.5px] font-medium">{fmtDate(r.last_contact_at)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[14px] bg-surface px-3.5 py-3">
              <span className="text-xs text-muted">Next step</span>
              <span className="text-[14.5px] font-medium">{r.next_step ?? "—"}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
