"use client";

import { useState, useTransition } from "react";
import { Icon } from "./ui";
import { saveOutreachFeedback } from "@/app/actions/crm";

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
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium tracking-[0.08em] text-faint">OUTREACH ANGLE · AI-DRAFTED</span>
        <CopyButton text={text} />
      </div>
      <p className="m-0 text-[15px] leading-[1.55] text-pretty text-ink">{text}</p>
      {accountId && signalEventId && (
        <FeedbackBar accountId={accountId} signalEventId={signalEventId} initial={initialRating ?? null} />
      )}
    </div>
  );
}

const FEEDBACK_OPTS: { key: "good" | "bad" | "improve"; icon: string; label: string }[] = [
  { key: "good", icon: "thumb_up", label: "Good" },
  { key: "bad", icon: "thumb_down", label: "Bad" },
  { key: "improve", icon: "tune", label: "Improve" },
];

/** Arjun rates the AI angle; the rating is fed back into future Gemini prompts. */
function FeedbackBar({ accountId, signalEventId, initial }: { accountId: string; signalEventId: string; initial: string | null }) {
  const [rating, setRating] = useState<string | null>(initial);
  const [isPending, start] = useTransition();

  const choose = (r: "good" | "bad" | "improve") => {
    const prev = rating;
    setRating(r);
    start(async () => {
      const res = await saveOutreachFeedback(accountId, signalEventId, r);
      if (!res.ok) setRating(prev);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
      <span className="text-[11px] font-medium tracking-[0.06em] text-faint">
        {rating ? "YOUR RATING — TEACHES THE NEXT DRAFT" : "RATE THIS ANGLE — TEACHES THE NEXT DRAFT"}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        {FEEDBACK_OPTS.map((o) => {
          const active = rating === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => choose(o.key)}
              disabled={isPending}
              title={o.label}
              aria-pressed={active}
              className={`sd-press flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-2.5 text-[12.5px] font-medium disabled:opacity-60 ${
                active ? "border-panel bg-panel text-white" : "border-line bg-surface text-muted hover:border-ink hover:text-ink"
              }`}
            >
              <Icon name={o.icon} size={15} />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
