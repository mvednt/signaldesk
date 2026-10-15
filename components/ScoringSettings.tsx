"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveScoringConfig } from "@/app/actions/settings";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "@/lib/scoring/config";
import { Card, CardTitle, Icon, PageHeader } from "./ui";

const CATEGORIES: { key: keyof ScoringConfig["category_weights"]; label: string }[] = [
  { key: "leadership", label: "Leadership (new CHRO / VP Ops)" },
  { key: "headcount", label: "Headcount / expansion" },
  { key: "digitalisation", label: "Workforce digitalisation" },
  { key: "funding", label: "Funding" },
  { key: "operational", label: "Operational challenge" },
  { key: "other", label: "Other" },
];
const SOURCES: { key: keyof ScoringConfig["source_weights"]; label: string }[] = [
  { key: "newsapi", label: "NewsAPI" },
  { key: "google_news_rss", label: "Google News (RSS)" },
  { key: "manual", label: "Manual" },
];

export default function ScoringSettings({ initial }: { initial: ScoringConfig }) {
  const router = useRouter();
  const [c, setC] = useState<ScoringConfig>(initial);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [isPending, start] = useTransition();

  const setCat = (k: keyof ScoringConfig["category_weights"], v: number) =>
    setC((p) => ({ ...p, category_weights: { ...p.category_weights, [k]: v } }));
  const setSrc = (k: keyof ScoringConfig["source_weights"], v: number) =>
    setC((p) => ({ ...p, source_weights: { ...p.source_weights, [k]: v } }));
  const setNum = (k: "decay_days" | "match_threshold" | "escalate_threshold" | "send_tier", v: number) =>
    setC((p) => ({ ...p, [k]: v }));

  const save = () => {
    setStatus(null);
    start(async () => {
      const res = await saveScoringConfig(c);
      if (res.ok) {
        setStatus({ kind: "ok", msg: `Saved — re-ranked ${res.accounts} account${res.accounts === 1 ? "" : "s"}.` });
        router.refresh();
      } else {
        setStatus({ kind: "err", msg: res.error });
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Scoring rubric"
        subtitle="Tune how accounts are scored and ranked. Saving re-ranks every account from its stored signals instantly — no re-scan needed."
      >
        <button
          onClick={() => { setC(DEFAULT_SCORING_CONFIG); setStatus(null); }}
          className="sd-press flex h-11 items-center gap-2 rounded-full border-[1.5px] border-line px-4 text-[14px] font-medium text-ink-2 hover:border-ink"
        >
          <Icon name="restart_alt" size={18} /> Reset to defaults
        </button>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <Card className="gap-3.5">
          <CardTitle>Trigger weights · the kind of news (0–1)</CardTitle>
          <p className="m-0 text-[13px] text-muted">Higher = this category pushes an account up the list. Leadership changes signal the strongest buying intent.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((f) => (
              <Weight key={f.key} label={f.label} value={c.category_weights[f.key]} onChange={(v) => setCat(f.key, v)} />
            ))}
          </div>
        </Card>

        <Card className="gap-3.5">
          <CardTitle>Source weights · how much to trust each source (0–1)</CardTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {SOURCES.map((f) => (
              <Weight key={f.key} label={f.label} value={c.source_weights[f.key]} onChange={(v) => setSrc(f.key, v)} />
            ))}
          </div>
        </Card>

        <Card className="gap-3.5">
          <CardTitle>Windows &amp; thresholds</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Num label="Recency decay (days)" hint="A signal's score decays to 0 over this window. Shorter = warmth fades faster." value={c.decay_days} min={1} max={365} step={1} onChange={(v) => setNum("decay_days", v)} />
            <Num label="Match threshold (0–1)" hint="Minimum entity-match confidence to even consider an article." value={c.match_threshold} min={0} max={1} step={0.05} onChange={(v) => setNum("match_threshold", v)} />
            <Num label="Escalate threshold (0–100)" hint="At/above this score, a lead auto-alerts Arjun via n8n." value={c.escalate_threshold} min={0} max={100} step={1} onChange={(v) => setNum("escalate_threshold", v)} />
            <Num label="One-click send tier (0–100)" hint="At/above this score, the one-click prospect-send button unlocks." value={c.send_tier} min={0} max={100} step={1} onChange={(v) => setNum("send_tier", v)} />
          </div>
        </Card>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            disabled={isPending}
            className="sd-press flex h-11 items-center gap-2 rounded-full border-0 bg-ember px-5 text-[15px] font-medium text-white disabled:opacity-60"
          >
            <Icon name={isPending ? "progress_activity" : "bolt"} size={18} className={isPending ? "animate-spin" : ""} />
            {isPending ? "Saving & recomputing…" : "Save & recompute"}
          </button>
          {status && (
            <span className={`flex items-center gap-1.5 text-[13.5px] font-medium ${status.kind === "ok" ? "text-ember-dark" : "text-ember-ink"}`}>
              <Icon name={status.kind === "ok" ? "check_circle" : "error"} size={16} />
              {status.msg}
            </span>
          )}
        </div>
        <p className="m-0 text-[12.5px] text-faint">Formula: <span className="font-mono">score = 100 × recency × trigger × source × match × AI-confidence</span>, taken from each account&apos;s strongest qualifying signal.</p>
      </div>
    </>
  );
}

function Weight({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      <div className="flex items-center gap-2.5">
        <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#e2552b]" />
        <input
          type="number" min={0} max={1} step={0.05} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 w-16 rounded-lg border-[1.5px] border-line bg-surface px-2 text-center font-mono text-[13.5px] text-ink outline-none focus:border-ember"
        />
      </div>
    </label>
  );
}

function Num({ label, hint, value, min, max, step, onChange }: {
  label: string; hint: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 rounded-xl border-[1.5px] border-line bg-surface px-3.5 font-mono text-[14.5px] text-ink outline-none focus:border-ember"
      />
      <span className="text-[12px] text-faint">{hint}</span>
    </label>
  );
}
