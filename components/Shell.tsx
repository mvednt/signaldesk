"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { DashboardRow } from "@/lib/data";
import { Icon } from "./ui";
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
      if (e.key === "Escape") setSelectedId(null);
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

  return (
    <Ctx.Provider value={{ query, setQuery, openAccount, selectedId }}>
      <div className="grid min-h-screen grid-cols-1 gap-4 p-4 text-ink lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-7 rounded-3xl bg-paper px-[18px] pb-[18px] pt-7 lg:sticky lg:top-4 lg:h-[calc(100vh-32px)]">
          <div className="flex items-center gap-2.5 px-2.5">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-[3px] border-ember">
              <div className="h-3 w-3 rounded-full bg-ink" />
            </div>
            <div className="text-[21px] font-semibold tracking-[-0.02em]">SignalDesk</div>
          </div>

          <nav className="flex flex-col gap-1">
            <div className="px-3 pb-2 text-[11px] font-medium tracking-[0.08em] text-[#8a8d93]">MENU</div>
            {nav.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] no-underline transition-colors hover:bg-track ${
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
          <header className="flex flex-wrap items-center gap-3.5 rounded-3xl bg-paper px-[18px] py-3.5">
            <label className="flex h-12 max-w-[440px] flex-[1_1_280px] items-center gap-2.5 rounded-full bg-white pl-[18px] pr-2">
              <Icon name="search" size={22} className="text-[#5e6168]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search accounts, signals"
                className="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
              />
              <kbd className="flex h-7 items-center rounded-lg bg-track px-2.5 font-mono text-xs text-[#5e6168]">⌘K</kbd>
            </label>
            <div className="flex-1" />
            <Link
              href="/hotlist"
              title="Hot List"
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white hover:bg-track"
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

          <main className="flex min-w-0 flex-col gap-5 rounded-3xl bg-paper p-5 sm:p-7">{children}</main>
        </div>
      </div>

      {selected && <AccountDrawer row={selected} onClose={() => setSelectedId(null)} />}
    </Ctx.Provider>
  );
}
