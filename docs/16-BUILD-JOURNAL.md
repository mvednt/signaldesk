# 16 · Build Journal

Authentic, milestone-by-milestone record. Never fabricate entries.

## Milestone report template
```
Objective — what we solved and why
Approach — chosen design + rejected alternatives
Changes — files, APIs, schema, components
Verification — exact tests/checks + results; limitations
Trade-offs — risks + what we deferred
Technical learning — how to explain it in a viva
Documentation updated — which files
Next step — one prioritized action
```

---

## 2026-10-12 — M1: Discovery audit + Foundation
**Objective** — Stand up the project skeleton, secrets, repo, and portability
docs; validate that the assessment's required integrations are actually reachable.

**Approach** — Discovery-first per the master brief (no code before audit).
Inspected environment and connectors read-only; chose Next.js + Supabase + Gemini
Flash + Vercel. Decided (with user): signal sources = Google News RSS primary +
NewsAPI.org dev enrichment; email = Resend; new isolated `signaldesk` infra;
Claude seeds 10 real Indian companies.

**Changes** — `create-next-app` scaffold (TS/Tailwind/App Router); `.env.local` +
`.env.example`; `AGENTS.md`, `CLAUDE.md`; docs 00/01/03/CURRENT-STATE/HANDOFF/
NEXT-STEPS/16. GitHub repo `mvednt/signaldesk` created (private).

**Verification (live, not assumed)** —
- Supabase org discovered; 4 unrelated projects; none is SignalDesk.
- New Supabase project cost = $0/mo; creation **blocked** by free 2-active-project
  limit (real finding, documented).
- Gemini: `gemini-2.0-flash` retired → **`gemini-3.8-flash`** returns HTTP 200.
  It is a *thinking* model: a 10-token test produced only reasoning tokens and
  empty text → AI layer must budget output tokens / set `thinkingConfig`.
- NewsAPI.org key → HTTP 200; GNews/NewsData → 401 (so provider = NewsAPI.org).
  Free tier is development-only → RSS chosen as the production-safe primary.

**Trade-offs** — Deferred DB creation on the active-project limit rather than
pausing a prior project unilaterally. NewsAPI can't be the deployed source.

**Technical learning (viva)** — Why RSS over a paid News API (production access +
cost + freshness); why the current Gemini Flash is a thinking model and how that
changes token budgeting; why we validate credentials during discovery (Check 03).

**Documentation updated** — all foundation docs above.

**Next step** — Resolve the Supabase slot, create `signaldesk`, then schema +
preservation test before any ingestion code.
