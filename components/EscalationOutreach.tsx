"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "./ui";
import CopyButton from "./CopyButton";
import { sendOutreach } from "@/app/actions/outreach";

const DEFAULT_SEND_TIER = Number(process.env.NEXT_PUBLIC_SEND_TIER) || 70;

/** The auto-drafted outreach (company voice) for an escalated account. For the
 *  hottest leads (score >= SEND_TIER) it adds a human-triggered one-click send
 *  — the recipient is entered explicitly; nothing is auto-sent to a prospect. */
export default function EscalationOutreach({
  subject,
  body,
  score,
}: {
  subject: string;
  body: string;
  score: number;
}) {
  const [sendTier, setSendTier] = useState(DEFAULT_SEND_TIER);
  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { send_tier?: number }) => { if (typeof d.send_tier === "number") setSendTier(d.send_tier); })
      .catch(() => {});
  }, []);
  const canSend = score >= sendTier;
  const [to, setTo] = useState("");
  const [draft, setDraft] = useState(body);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [isPending, start] = useTransition();

  const send = () => {
    setStatus(null);
    start(async () => {
      const res = await sendOutreach(to, subject, draft);
      if (res.ok) setStatus({ kind: "ok", msg: `Sent to ${to}.` });
      else setStatus({ kind: "err", msg: res.error });
    });
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-ember/40 bg-ember-soft/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-ember-ink">
          <Icon name="bolt" size={14} /> AUTO-DRAFTED OUTREACH · COMPANY VOICE
        </span>
        <CopyButton text={`Subject: ${subject}\n\n${draft}`} />
      </div>
      <div className="text-[13px] font-semibold text-ink">{subject}</div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={7}
        className="w-full resize-y rounded-xl border-[1.5px] border-line bg-surface px-3.5 py-3 text-[14px] leading-[1.55] text-ink outline-none focus:border-ember"
      />

      {canSend ? (
        <div className="flex flex-col gap-2 border-t border-ember/30 pt-2.5">
          <span className="text-[11px] font-medium tracking-[0.06em] text-ember-ink">
            HOT LEAD ({score.toFixed(0)}+) · ONE-CLICK SEND
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              type="email"
              placeholder="recipient email"
              className="h-9 min-w-0 flex-1 rounded-full border-[1.5px] border-line bg-surface px-3.5 text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-ember"
            />
            <button
              onClick={send}
              disabled={isPending || !to.trim()}
              className="sd-press flex h-9 items-center gap-1.5 rounded-full border-0 bg-ember px-4 text-[13.5px] font-medium text-white disabled:opacity-50"
            >
              <Icon name={isPending ? "progress_activity" : "send"} size={15} className={isPending ? "animate-spin" : ""} />
              {isPending ? "Sending…" : "Send"}
            </button>
          </div>
          {status ? (
            <span className={`flex items-center gap-1.5 text-[12.5px] font-medium ${status.kind === "ok" ? "text-ember-dark" : "text-ember-ink"}`}>
              <Icon name={status.kind === "ok" ? "check_circle" : "error"} size={15} />
              {status.msg}
            </span>
          ) : (
            <span className="text-[11.5px] text-muted">You choose the recipient and send — never auto-sent to the prospect.</span>
          )}
        </div>
      ) : (
        <span className="text-[11.5px] text-muted">Staged for you. One-click send unlocks at score {sendTier}+.</span>
      )}
    </div>
  );
}
