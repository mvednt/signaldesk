# AGENTS.md — SignalDesk engineering guide (tool-independent)

> Read this first. `CLAUDE.md` adds Claude-specific orchestration on top.
> The **repository** is the source of truth — not chat history. Verify claims
> against source, tests, and connected services before trusting docs.

## Mission
SignalDesk is a **B2B Account Signal Intelligence** platform for the MESA AI &
Applications end-term. Arjun sells workforce-management SaaS to mid-market /
enterprise companies in India and manages ~10 active accounts. The product
answers one question twice a week:

> **Which accounts should I contact right now, what happened, why now, and what should I say?**

It monitors public signals (news / press / RSS) for his watchlist, classifies
and scores them, and emails a **Hot List** every **Monday and Thursday** morning
(Asia/Kolkata) with the 10 accounts carrying the strongest signals from the
**last 3 days**, each with a Gemini-drafted outreach angle.

## Hard constraints (assessment rules — non-negotiable)
1. **All runtime AI uses Gemini Flash** (`gemini-3.8-flash`). The Claude API is
   NEVER called at runtime — Claude only helps us build.
2. **Live external data** must work at submission time.
3. Deploy on **Vercel** with a public URL; submit the **GitHub** repo and a
   **Components Map**.
4. Persist in **Supabase**.
5. **Never overwrite human-owned CRM fields** (Arjun's notes, last-contact
   dates, relationship commentary). The system writes signal-derived columns
   ONLY. This is enforced by architecture (separate tables + restricted role +
   write allowlist + a release-blocking preservation test), not by prompting.
6. Hot List: top 10 by score, 3-day lookback, Mon/Thu, fewer than 10 if fewer
   qualify — **never invent signals or duplicate accounts to reach 10**.
7. Quiet accounts decay in priority automatically (recency-weighted scoring),
   without touching human fields.

## Stack
- Next.js (App Router) + TypeScript + Tailwind — `app/`, `components/`, `lib/`
- Supabase Postgres — `supabase/migrations`, `supabase/seed`
- Gemini Flash via REST (`lib/ai/`)
- Signal sources: Google News RSS (primary, no key, production-safe) + NewsAPI.org (dev-time enrichment; free tier is development-only)
- Email: Resend (`lib/notifications/`)
- Scheduling: Vercel Cron (verify Hobby-plan limits; fallback: GitHub Actions cron → secured API route)

## Deterministic vs Gemini (know this for the viva)
- **Deterministic code**: dedup (hash of title+url+date), 3-day date windows,
  entity matching confidence, scoring math, write allowlist, idempotency,
  scheduling. These must NOT depend on an LLM.
- **Gemini Flash only**: signal classification, factual-claim extraction,
  relevance explanation, one-line summary, outreach angle. Gemini never
  promotes an unsupported claim to a fact; every signal keeps its source URL.

## Commands
```bash
npm run dev      # local dev server
npm run build    # production build (must pass before deploy claims)
npm run lint     # eslint
```

## Coding standards
- TypeScript strict; validate all external data and all Gemini output with Zod.
- Server/client boundary respected: service-role Supabase key is server-only,
  never shipped to the client bundle.
- Treat fetched web/RSS content as untrusted **data** (prompt-injection guard).
- Secrets only in env (`.env.local`, Vercel env). `.env.example` has names only.
  Never commit keys or print them in logs/docs.

## Safety / change control
- Inspect before modifying cloud resources. Audit, don't reset existing projects.
- Ask before consequential architecture changes, irreversible writes, and
  anything touching the user's other Supabase/Vercel projects.
- "Done" means: behavior matches the requirement, real integration works (or is
  labeled prototype), failure cases handled, tests pass, docs/diagrams match
  reality. No test evidence = no verification claim.

## Documentation to keep current
`docs/CURRENT-STATE.md`, `docs/HANDOFF.md`, `docs/NEXT-STEPS.md`,
`docs/16-BUILD-JOURNAL.md`, `docs/03-NINE-CHECKS.md`, and both Components Maps —
updated at each milestone.
