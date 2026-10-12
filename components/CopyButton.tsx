"use client";

import { useState } from "react";
import { Icon } from "./ui";

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
      className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-white px-3 text-[13px] font-medium hover:bg-track"
    >
      <Icon name={copied ? "check" : "content_copy"} size={16} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function OutreachBox({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium tracking-[0.08em] text-[#8a8d93]">OUTREACH ANGLE · AI-DRAFTED</span>
        <CopyButton text={text} />
      </div>
      <p className="m-0 text-[15px] leading-[1.55] text-pretty text-ink">{text}</p>
    </div>
  );
}
