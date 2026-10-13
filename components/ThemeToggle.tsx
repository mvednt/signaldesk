"use client";

import { useEffect, useState } from "react";
import { Icon } from "./ui";

type Theme = "light" | "dark";

function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const set = document.documentElement.getAttribute("data-theme");
  return set === "dark" || set === "light" ? set : systemTheme();
}

/** Light/dark toggle. Persists to localStorage; the no-flash script in the
 *  layout head applies the saved value before first paint. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sd-theme", next);
    } catch {}
    setTheme(next);
  }

  // Render a stable placeholder until mounted to avoid a hydration mismatch.
  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`sd-press flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink hover:bg-track ${className}`}
    >
      <Icon name={isDark ? "light_mode" : "dark_mode"} size={22} />
    </button>
  );
}
