"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const ERRORS: Record<string, string> = {
  not_configured: "Google sign-in isn't configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  denied: "Sign-in was cancelled.",
  state: "Sign-in expired or was interrupted. Please try again.",
  exchange: "Couldn't complete Google sign-in. Please try again.",
};

/** Sign-in gate. Identity is handled by Google OAuth — anyone with a Google
 *  account can sign in. This is the access gate for the interface; the real
 *  write boundary is still enforced at the database (the signal_writer role). */
export default function LoginScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("auth_error");
    if (code) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the URL once on mount
      setError(ERRORS[code] ?? "Sign-in failed. Please try again.");
      // Clean the URL so a refresh doesn't keep showing the error.
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-ink">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div
        style={{ WebkitBackdropFilter: "blur(22px) saturate(1.55)", backdropFilter: "blur(22px) saturate(1.55)" }}
        className="glass-card sd-rise flex w-full max-w-[400px] flex-col gap-6 rounded-[26px] p-7 sm:p-8"
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
          <p className="m-0 text-[14.5px] text-muted">Sign in with your Google account to continue.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-ember-soft px-3.5 py-2.5 text-[13.5px] font-medium text-ember-ink">
            {error}
          </div>
        )}

        <a
          href="/api/auth/login"
          className="sd-press flex h-12 items-center justify-center gap-3 rounded-full border-[1.5px] border-line bg-surface text-[15.5px] font-medium text-ink hover:bg-track"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
        </a>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[12px] font-medium text-faint">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <a
          href="/api/auth/demo"
          className="sd-press flex h-11 items-center justify-center gap-2 rounded-full text-[14.5px] font-medium text-muted hover:text-ink hover:bg-track"
        >
          Continue with demo account
        </a>

        <p className="m-0 text-center text-[12px] leading-[1.5] text-faint">
          Google sign-in reads only your name and email to identify you; outreach you send carries your address as Reply-To. The demo account signs you in as Arjun.
        </p>
      </div>
    </div>
  );
}
