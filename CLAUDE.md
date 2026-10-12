# CLAUDE.md — Claude orchestration for SignalDesk

**Read [AGENTS.md](AGENTS.md) first** for mission, constraints, stack, and
standards. This file adds Claude-specific workflow. Do not duplicate AGENTS.md.

## Read-first order when resuming
1. `AGENTS.md`
2. `docs/00-START-HERE.md`
3. `docs/CURRENT-STATE.md`
4. `docs/HANDOFF.md`
5. `docs/NEXT-STEPS.md`
6. `docs/03-NINE-CHECKS.md`
7. `docs/05-COMPONENTS-MAP.md` (when it exists)

Then inspect actual source, migrations, tests, and connected services. **Verify
documentation claims against reality** before building on them.

## Tooling available in this environment (verified 2026-10-12)
- **Supabase MCP** — org `MESA School of Business` (`tgebcozdiawhadfpmqhp`).
  Project `signaldesk` pending creation (blocked on free 2-active-project limit).
- **Vercel MCP** — personal/Hobby account; verify cron limits before relying on
  twice-weekly scheduling.
- **GitHub** — `gh` CLI authed as `mvednt`. Repo: `mvednt/signaldesk` (private).
- Built-in browser + Claude in Chrome for design research and QA.
- Resend / NewsAPI / Gemini keys live in `.env.local` (validated working).

## Operating rules
- Build in **reviewable milestones**, not one uncontrolled run. Use the
  milestone report template in `docs/16-BUILD-JOURNAL.md`.
- Execute authorized work directly (don't just hand the user steps Claude can do
  safely), but pause for review before consequential architecture, irreversible
  writes, or anything affecting the user's other projects.
- Runtime AI = **Gemini Flash only**. Claude is the builder, never the runtime.
- Update `CURRENT-STATE`, `HANDOFF`, `NEXT-STEPS`, `BUILD-JOURNAL` and affected
  diagrams at the end of each milestone and before ending a session.
- Never fabricate data, citations, test results, or deployment status.

## Resume prompt
See the universal resume block in `docs/HANDOFF.md`.
