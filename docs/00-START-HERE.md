# 00 · Start Here

SignalDesk — B2B Account Signal Intelligence Platform (MESA AI & Applications
end-term). This folder is the portable brain of the project.

## What this is
A system for **Arjun** (sells workforce-management SaaS to Indian mid-market /
enterprise accounts) that tells him, twice a week, **which accounts are warm
right now, what changed, why it matters, and what to say** — and emails him a
Hot List every Monday and Thursday morning. It never overwrites his own CRM
notes; it only writes what it discovers.

## Non-negotiables
- Runtime AI = **Gemini Flash only** (`gemini-3.8-flash`); no Claude API at runtime.
- Live external data · deploy on **Vercel** · **GitHub** repo · **Components Map**.
- Store in **Supabase**; **human-owned CRM fields are never overwritten**.
- Hot List: 10 strongest signals from the last 3 days, Mon/Thu; fewer if fewer qualify.

## Map of the docs
- `01-PROBLEM-STATEMENT.md` — the official brief, verbatim essentials.
- `03-NINE-CHECKS.md` — "Does this deserve to be built?" assessment.
- `05-COMPONENTS-MAP.md` — executive + technical architecture (built later).
- `CURRENT-STATE.md` — what is actually implemented / partial / blocked.
- `HANDOFF.md` — where to resume + the universal resume prompt.
- `NEXT-STEPS.md` — prioritized backlog with acceptance criteria.
- `16-BUILD-JOURNAL.md` — milestone-by-milestone record.

Numbered docs (02, 04, 06–20) are created as the milestones that fill them are
reached — we do not create empty placeholder docs.

## Current phase
**Foundation.** Scaffold + secrets + repo in place; Supabase project blocked on a
free-tier limit decision. See `CURRENT-STATE.md`.
