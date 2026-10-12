import type { ReactNode } from "react";
import type { DashboardRow } from "@/lib/data";

export const CATEGORY_LABEL: Record<string, string> = {
  headcount: "Headcount",
  leadership: "Leadership",
  funding: "Funding",
  digitalisation: "Digitalisation",
  operational: "Operational",
  other: "Other",
};

export const SOURCE_LABEL: Record<string, string> = {
  google_news_rss: "Google News",
  newsapi: "NewsAPI",
  manual: "Manual",
};

export const STAGE_ORDER = ["customer", "pilot", "outreach", "expansion"];

const AVATARS: [string, string][] = [
  ["#fbe7df", "#a93a18"],
  ["#e6eee8", "#2f5b3c"],
  ["#e7ecf5", "#2d4a7a"],
  ["#f3ecdd", "#7a5a1e"],
  ["#eeeafb", "#4e3ba8"],
  ["#edebe6", "#3a3d44"],
];

export function fmtDate(iso: string | null, withYear = true): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", withYear ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
}

export function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function avatarColors(name: string): [string, string] {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATARS[h % AVATARS.length];
}

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function stagesOf(rows: DashboardRow[]): string[] {
  const set = new Set(rows.map((r) => r.relationship_stage).filter(Boolean) as string[]);
  return [...STAGE_ORDER.filter((s) => set.has(s)), ...[...set].filter((s) => !STAGE_ORDER.includes(s))];
}

export function matchesQuery(r: DashboardRow, q: string): boolean {
  if (!q) return true;
  return [r.name, r.industry, r.hq_city, r.relationship_notes, r.top_title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q.toLowerCase());
}

export function Icon({ name, className = "", size = 20 }: { name: string; className?: string; size?: number }) {
  return (
    <span aria-hidden className={`material-symbols-rounded inline-block ${className}`} style={{ fontSize: size }}>
      {name}
    </span>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const [bg, fg] = avatarColors(name);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.32 }}
    >
      {initials(name)}
    </span>
  );
}

export function StageChip({ stage }: { stage: string | null }) {
  if (!stage) return null;
  return <span className="rounded-full bg-human-soft px-2 py-0.5 text-xs font-medium text-human-ink">{stage}</span>;
}

export function CategoryChip({ category }: { category: string | null }) {
  if (!category) return null;
  return (
    <span className="rounded-full bg-ember-soft px-2.5 py-0.5 text-xs font-medium text-ember-ink">
      {CATEGORY_LABEL[category] ?? category}
    </span>
  );
}

export function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">Could not load data: {error}</div>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`flex min-w-0 flex-col rounded-[22px] bg-white p-[22px] ${className}`}>{children}</section>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="m-0 text-[19px] font-semibold tracking-[-0.015em]">{children}</h2>;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em]">{title}</h1>
        <p className="m-0 text-[15.5px] text-pretty text-muted">{subtitle}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
    </div>
  );
}
