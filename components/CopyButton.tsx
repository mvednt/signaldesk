"use client";

import { useState, useTransition } from "react";
import { Icon } from "./ui";
import { saveOutreachFeedback } from "@/app/actions/crm";
import { improveOutreachAngle } from "@/app/actions/angle";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-surface px-3 text-[13px] font-medium hover:bg-track"
    >
      <Icon name={copied ? "check" : "content_copy"} size={16} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function OutreachBox({
  text,
  accountId,
  signalEventId,
  initialRating,
}: {
  text: string;
  accountId?: string;
  signalEventId?: string | null;
  initialRating?: string | null;
}) {
  const [angle, setAngle] = useState(text);
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium tracking-[0.08em] text-faint">OUTREACH ANGLE · AI-DRAFTED</span>
        <CopyButton text={angle} />
      </div>
      <p className="m-0 text-[15px] leading-[1.55] text-pretty text-ink">{angle}</p>
      {accountId && signalEventId && (
        <FeedbackBar
          accountId={accountId}
          signalEventId={signalEventId}
          initial={initialRating ?? null}
          currentAngle={angle}
          onImproved={setAngle}
        />
      )}
    </div>
  );
}

const FEEDBACK_OPTS: { key: "good" | "bad" | "improve"; icon: string; label: string }[] = [
  { key: "good", icon: "thumb_up", label: "Good" },
  { key: "bad", icon: "thumb_down", label: "Bad" },
  { key: "improve", icon: "auto_fix_high", label: "Improve" },
];

const DONE_MSG: Record<string, string> = {
  good: "Saved — future drafts will lean this way.",
  bad: "Saved — future drafts will avoid this style.",
  improve: "Rewritten — a sharper angle, and future drafts will follow it.",
};

/** Rate the AI angle. Good/Bad teach the next draft; Improve regenerates this
 *  one now with Gemini and replaces it in place. */
function FeedbackBar({
  accountId,
  signalEventId,
  initial,
  currentAngle,
  onImproved,
}: {
  accountId: string;
  signalEventId: string;
  initial: string | null;
  currentAngle: string;
  onImproved: (angle: string) => void;
}) {
  const [rating, setRating] = useState<string | null>(initial);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const choose = (r: "good" | "bad" | "improve") => {
    const prev = rating;
    setRating(r);
    setStatus(null);
    setBusy(r);
    start(async () => {
      if (r === "improve") {
        const res = await improveOutreachAngle(accountId, signalEventId, currentAngle);
        if (res.ok) {
          onImproved(res.angle);
          setStatus({ kind: "ok", msg: DONE_MSG.improve });
        } else {
          setRating(prev);
          setStatus({ kind: "err", msg: res.error });
        }
      } else {
        const res = await saveOutreachFeedback(accountId, signalEventId, r);
        if (res.ok) setStatus({ kind: "ok", msg: DONE_MSG[r] });
        else {
          setRating(prev);
          setStatus({ kind: "err", msg: res.error });
        }
      }
      setBusy(null);
    });
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium tracking-[0.06em] text-faint">
          {rating ? "YOUR RATING — TEACHES THE NEXT DRAFT" : "RATE THIS ANGLE — TEACHES THE NEXT DRAFT"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {FEEDBACK_OPTS.map((o) => {
            const active = rating === o.key;
            const loading = isPending && busy === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => choose(o.key)}
                disabled={isPending}
                title={o.key === "improve" ? "Rewrite a sharper angle" : o.label}
                aria-pressed={active}
                className={`sd-press flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-2.5 text-[12.5px] font-medium disabled:opacity-60 ${
                  active ? "border-panel bg-panel text-white" : "border-line bg-surface text-muted hover:border-ink hover:text-ink"
                }`}
              >
                <Icon name={loading ? "progress_activity" : o.icon} size={15} className={loading ? "animate-spin" : ""} />
                {o.key === "improve" && loading ? "Rewriting…" : o.label}
              </button>
            );
          })}
        </div>
      </div>
      {status && (
        <span className={`flex items-center gap-1.5 text-[12.5px] font-medium ${status.kind === "ok" ? "text-ember-dark" : "text-ember-ink"}`}>
          <Icon name={status.kind === "ok" ? "check_circle" : "error"} size={15} />
          {status.msg}
        </span>
      )}
    </div>
  );
}
