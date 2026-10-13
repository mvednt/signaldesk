"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "dark" || set === "light") return set;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ProfileMenu({
  name,
  email,
  role,
  accounts,
  onLogout,
}: {
  name: string;
  email: string;
  role: string;
  accounts: number;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setTheme(currentTheme()), [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleTheme() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sd-theme", next);
    } catch {}
    setTheme(next);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="sd-press flex items-center gap-3 rounded-full py-0.5 pl-1 pr-2 hover:bg-track"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-human-soft text-base font-semibold text-human-ink">
          {initial}
        </span>
        <span className="hidden flex-col gap-0.5 text-left sm:flex">
          <span className="text-[15px] font-semibold text-ink">{name}</span>
          <span className="text-[13px] text-muted">{role} · {accounts} accounts</span>
        </span>
        <Icon name={open ? "expand_less" : "expand_more"} size={20} className="hidden text-muted sm:inline-block" />
      </button>

      {open && (
        <div
          role="menu"
          className="glass-card sd-rise absolute right-0 top-[58px] z-50 flex w-[272px] flex-col gap-1 rounded-2xl p-2"
          style={{
            WebkitBackdropFilter: "blur(22px) saturate(1.55)",
            backdropFilter: "blur(22px) saturate(1.55)",
            background: "color-mix(in srgb, var(--surface) 94%, transparent)",
          }}
        >
          <div className="flex items-center gap-3 rounded-xl px-2.5 py-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-human-soft text-lg font-semibold text-human-ink">
              {initial}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-semibold text-ink">{name}</span>
              <span className="truncate text-[12.5px] text-muted">{email}</span>
            </div>
          </div>

          <div className="flex gap-2 px-1 pb-1">
            <span className="flex flex-1 flex-col gap-0.5 rounded-xl bg-paper px-3 py-2.5">
              <span className="text-[11px] font-medium tracking-[0.06em] text-faint">ROLE</span>
              <span className="text-[13px] font-medium text-ink-2">{role}</span>
            </span>
            <span className="flex flex-1 flex-col gap-0.5 rounded-xl bg-paper px-3 py-2.5">
              <span className="text-[11px] font-medium tracking-[0.06em] text-faint">ACCOUNTS</span>
              <span className="text-[13px] font-medium text-ink-2">{accounts}</span>
            </span>
          </div>

          <div className="my-1 h-px bg-line" />

          <button
            onClick={copyEmail}
            role="menuitem"
            className="sd-press flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[14px] text-ink hover:bg-track"
          >
            <Icon name={copied ? "check" : "mail"} size={20} className="text-muted" />
            {copied ? "Email copied" : "Copy email"}
          </button>

          <button
            onClick={toggleTheme}
            role="menuitem"
            className="sd-press flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[14px] text-ink hover:bg-track"
          >
            <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} className="text-muted" />
            <span className="flex-1">Appearance</span>
            <span className="text-[12.5px] font-medium text-muted">{theme === "dark" ? "Dark" : "Light"}</span>
          </button>

          <div className="my-1 h-px bg-line" />

          <button
            onClick={onLogout}
            role="menuitem"
            className="sd-press flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[14px] font-medium text-ember-ink hover:bg-ember-soft"
          >
            <Icon name="logout" size={20} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
