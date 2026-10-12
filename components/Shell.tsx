"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { DashboardRow } from "@/lib/data";
import { Avatar, Icon, StageChip, glassStyle, matchesQuery } from "./ui";
import AccountDrawer from "./AccountDrawer";

type ShellCtx = { query: string; setQuery: (q: string) => void; openAccount: (id: string) => void; selectedId: string | null };
const Ctx = createContext<ShellCtx>({ query: "", setQuery: () => {}, openAccount: () => {}, selectedId: null });
export const useShell = () => useContext(Ctx);

export default function Shell({ rows, hotCount, children }: { rows: DashboardRow[]; hotCount: number; children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const openAccount = useCallback((id: string) => setSelectedId(id), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") { setSelectedId(null); setQuery(""); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nav = [
    { href: "/", label: "Dashboard", icon: "space_dashboard" },
    { href: "/hotlist", label: "Hot List", icon: "local_fire_department", badge: String(hotCount), hot: true },
    { href: "/accounts", label: "Accounts", icon: "apartment", badge: String(rows.length) },
  ];
  const selected = rows.find((r) => r.account_id === selectedId) ?? null;
  const q = query.trim();
  const results = q ? rows.filter((r) => matchesQuery(r, query)).sort((a, b) => b.score - a.score).slice(0, 8) : [];

  return (
    <Ctx.Provider value={{ query, setQuery, openAccount, selectedId }}>
      <div className="grid min-h-screen grid-cols-1 gap-4 p-4 text-ink lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside style={glassStyle} className="glass flex flex-col gap-7 rounded-3xl px-[18px] pb-[18px] pt-7 lg:sticky lg:top-4 lg:h-[calc(100vh-32px)]">
          <Link
            href="/"
            aria-label="SignalDesk — back to dashboard"
            className="sd-press group flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 no-underline hover:bg-white/50"
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-ember shadow-[0_8px_22px_-8px_rgba(226,85,43,.8)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                <circle cx="13" cy="21" r="3" fill="#fff" />
                <path d="M20 21A7 7 0 0 0 13 14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M24 21A11 11 0 0 0 13 10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-[21px] font-semibold tracking-[-0.02em]">SignalDesk</div>
          </Link>

          <nav className="flex flex-col gap-1">
            <div className="px-3 pb-2 text-[11px] font-medium tracking-[0.08em] text-[#8a8d93]">MENU</div>
            {nav.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`sd-press flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] no-underline hover:bg-track ${
                    active ? "bg-white font-semibold text-ink" : "text-[#5e6168]"
                  }`}
                >
                  <Icon name={n.icon} size={21} />
                  <span className="flex-1">{n.label}</span>
                  {n.badge && (
                    <span
                      className={`flex h-5 min-w-6 items-center justify-center rounded-full px-[7px] text-[11px] font-semibold ${
                        n.hot ? "bg-ember text-white" : "bg-[#e3e0d9] text-ink-2"
                      }`}
                    >
                      {n.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden flex-col gap-3 rounded-[18px] bg-ink p-[18px] text-[#f4f2ec] lg:flex">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <Icon name="shield_lock" size={18} className="text-[#f08a63]" />
              Write boundary
            </div>
            <p className="m-0 text-[12.5px] leading-normal text-pretty text-[#b9bbc0]">
              SignalDesk writes only what it discovers. Your CRM notes are never overwritten.
            </p>
            <div className="flex flex-col gap-1.5 text-xs text-[#d7d8db]">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-ember" />System-derived</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-human" />Arjun&apos;s own</span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <header style={glassStyle} className="glass flex flex-wrap items-center gap-3.5 rounded-3xl px-[18px] py-3.5">
            <div className="relative max-w-[440px] flex-[1_1_280px]">
              <label className="flex h-12 w-full items-center gap-2.5 rounded-full bg-white pl-[18px] pr-2">
                <Icon name="search" size={22} className="text-[#5e6168]" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search accounts, signals"
                  className="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
                />
                {query ? (
                  <button
                    onClick={() => { setQuery(""); searchRef.current?.focus(); }}
                    aria-label="Clear search"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#5e6168] hover:bg-track"
                  >
                    <Icon name="close" size={18} />
                  </button>
                ) : (
                  <kbd className="flex h-7 items-center rounded-lg bg-track px-2.5 font-mono text-xs text-[#5e6168]">⌘K</kbd>
                )}
              </label>
              {q && (
                <div className="absolute inset-x-0 top-[54px] z-30 flex flex-col gap-0.5 rounded-2xl bg-white p-2 shadow-[0_24px_70px_rgba(21,23,28,.20)]">
                  {results.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-muted">No accounts match “{query}”.</div>
                  ) : (
                    results.map((r) => (
                      <button
                        key={r.account_id}
                        onClick={() => { openAccount(r.account_id); setQuery(""); }}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-paper"
                      >
                        <Avatar name={r.name} size={32} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[14px] font-medium">{r.name}</span>
                          <span className="truncate text-[12px] text-muted">{r.top_title ?? "No fresh qualifying signal"}</span>
                        </span>
                        <StageChip stage={r.relationship_stage} />
                        <span className="font-mono text-[13px] text-muted">{r.score.toFixed(0)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex-1" />
            <Link
              href="/hotlist"
              title="Hot List"
              className="sd-press relative flex h-12 w-12 items-center justify-center rounded-full bg-white hover:bg-track"
            >
              <Icon name="notifications" size={22} />
              {hotCount > 0 && <span className="absolute right-[13px] top-3 h-2 w-2 rounded-full border-2 border-white bg-ember" />}
            </Link>
            <div className="flex items-center gap-3 pl-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-human-soft text-base font-semibold text-human-ink">A</div>
              <div className="flex flex-col gap-0.5">
                <div className="text-[15px] font-semibold">Arjun</div>
                <div className="text-[13px] text-muted">Account Executive · {rows.length} accounts</div>
              </div>
            </div>
          </header>

          <main key={pathname} style={glassStyle} className="glass sd-enter flex min-w-0 flex-col gap-5 rounded-3xl p-5 sm:p-7">{children}</main>
        </div>
      </div>

      {selected && <AccountDrawer row={selected} onClose={() => setSelectedId(null)} />}
    </Ctx.Provider>
  );
}
