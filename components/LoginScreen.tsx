"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "./ui";
import ThemeToggle from "./ThemeToggle";

const USERNAME = "arjun";
const PASSWORD = "1234";

/** Demo sign-in gate. The credentials live in the client, so this is a
 *  presentation layer for the account UI — not a security boundary. The real
 *  write protection is enforced at the database (the signal_writer role). */
export default function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (username.trim().toLowerCase() === USERNAME && password === PASSWORD) {
      setError(null);
      onSuccess();
    } else {
      setError("Incorrect username or password.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-ink">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <form
        onSubmit={submit}
        style={{ WebkitBackdropFilter: "blur(22px) saturate(1.55)", backdropFilter: "blur(22px) saturate(1.55)" }}
        className="glass-card sd-rise flex w-full max-w-[400px] flex-col gap-5 rounded-[26px] p-7 sm:p-8"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-ember shadow-[0_8px_22px_-8px_rgba(226,85,43,.8)]">
            <svg width="38" height="38" viewBox="0 0 34 34" fill="none" aria-hidden="true">
              <circle cx="13" cy="21" r="3" fill="#fff" />
              <path d="M20 21A7 7 0 0 0 13 14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M24 21A11 11 0 0 0 13 10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em]">SignalDesk</div>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[26px] font-semibold tracking-[-0.025em]">Welcome back</h1>
          <p className="m-0 text-[14.5px] text-muted">Sign in to your account signal workspace.</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-ink-2">Username</span>
          <input
            id="login-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            placeholder="arjun"
            className="h-12 rounded-xl border-[1.5px] border-line bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-faint focus:border-ember"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-ink-2">Password</span>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••"
            className="h-12 rounded-xl border-[1.5px] border-line bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-faint focus:border-ember"
          />
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-ember-soft px-3.5 py-2.5 text-[13.5px] font-medium text-ember-ink">
            <Icon name="error" size={18} />
            {error}
          </div>
        )}

        <button
          type="submit"
          className="sd-press flex h-12 items-center justify-center gap-2 rounded-full border-0 bg-ember text-[15.5px] font-medium text-white hover:bg-ember-dark"
        >
          <Icon name="login" size={20} />
          Sign in
        </button>

        <div className="flex items-start gap-2 rounded-xl bg-paper px-3.5 py-3 text-[13px] text-muted">
          <Icon name="lightbulb" size={17} className="mt-px text-ember-ink" />
          <span>
            Demo login — username <span className="font-mono font-semibold text-ink-2">arjun</span>, password{" "}
            <span className="font-mono font-semibold text-ink-2">1234</span>.
          </span>
        </div>
      </form>

      <p className="mt-5 max-w-[400px] text-center text-[12px] leading-[1.5] text-faint">
        Demo gate for the account interface. The real write boundary is enforced at the database, not here.
      </p>
    </div>
  );
}
