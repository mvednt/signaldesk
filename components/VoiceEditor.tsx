"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCompanyVoice } from "@/app/actions/crm";
import type { VoiceFields } from "@/lib/db/crm";
import { Icon, PageHeader } from "./ui";

const FIELDS: { key: keyof VoiceFields; label: string; hint: string; area?: boolean }[] = [
  { key: "company_name", label: "Company name", hint: "Who the outreach comes from." },
  { key: "sender_name", label: "Sender name", hint: "The person signing off (e.g. Arjun)." },
  { key: "product", label: "Product", hint: "What you sell, in one line.", area: true },
  { key: "value_prop", label: "Value proposition", hint: "The outcome you deliver.", area: true },
  { key: "audience", label: "Audience", hint: "Who you sell to." },
  { key: "tone", label: "Tone", hint: "How every draft should sound.", area: true },
  { key: "signoff", label: "Sign-off", hint: "How emails close." },
  { key: "guidelines", label: "Guidelines", hint: "Rules every draft must follow.", area: true },
];

export default function VoiceEditor({ initial }: { initial: VoiceFields }) {
  const router = useRouter();
  const [v, setV] = useState<VoiceFields>(initial);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [isPending, start] = useTransition();

  const set = (k: keyof VoiceFields, val: string) => setV((p) => ({ ...p, [k]: val }));

  const save = () => {
    setStatus(null);
    start(async () => {
      const res = await saveCompanyVoice(v);
      if (res.ok) {
        setStatus({ kind: "ok", msg: "Saved — every AI draft now follows this voice." });
        router.refresh();
      } else {
        setStatus({ kind: "err", msg: res.error });
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Company voice"
        subtitle="The persona every AI outreach draft follows — angles, the Improve rewrite, and the auto-drafted escalation email."
      />
      <div className="flex max-w-[720px] flex-col gap-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-2">{f.label}</span>
            {f.area ? (
              <textarea
                value={v[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                rows={2}
                className="resize-y rounded-xl border-[1.5px] border-line bg-surface px-3.5 py-2.5 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-ember"
              />
            ) : (
              <input
                value={v[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-11 rounded-xl border-[1.5px] border-line bg-surface px-3.5 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-ember"
              />
            )}
            <span className="text-[12px] text-faint">{f.hint}</span>
          </label>
        ))}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            disabled={isPending}
            className="sd-press flex h-11 items-center gap-2 rounded-full border-0 bg-ember px-5 text-[15px] font-medium text-white disabled:opacity-60"
          >
            <Icon name={isPending ? "progress_activity" : "check"} size={18} className={isPending ? "animate-spin" : ""} />
            {isPending ? "Saving…" : "Save voice"}
          </button>
          {status && (
            <span className={`flex items-center gap-1.5 text-[13.5px] font-medium ${status.kind === "ok" ? "text-ember-dark" : "text-ember-ink"}`}>
              <Icon name={status.kind === "ok" ? "check_circle" : "error"} size={16} />
              {status.msg}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
