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

---

## 2026-10-12 — M2: Database foundation + preservation guarantee
**Objective** — Stand up the schema with human/system separation and prove,
with live evidence, that the automated path cannot overwrite Arjun's CRM data.

**Approach** — Paused `aangan-front-desk` (user-approved, reversible) to free a
Supabase free-tier slot; created project `signaldesk` (ap-south-1). Designed two
protected human tables + six system tables + shared `accounts`. Enforced the
preservation guarantee at the **DB privilege layer** via a dedicated
`signal_writer` role (grants on system tables only; `REVOKE ALL` on human tables;
`BYPASSRLS` so it needs no per-row policies for system writes). RLS on all tables
(anon read-only; human writes only by `authenticated`). Rejected relying on the
service-role key (bypasses everything) or on prompting Gemini.

**Changes** — `supabase/migrations/0001_init.sql`, `0002_harden_function.sql`;
`supabase/seed/0001_accounts.sql` (10 real Indian companies + CRM);
`supabase/tests/preservation_proof.sql`.

**Verification (live)** —
- As `signal_writer`: `UPDATE account_crm` → `ERROR 42501 permission denied`;
  `INSERT signal_events` → 1 row; human note + last_contact **unchanged**.
- `preservation_proof.sql` ran without exception (self-asserting → PASSED).
- Supabase security advisors: **0 issues** after hardening `set_updated_at`
  (`search_path=''`).

**Trade-offs** — `signal_writer` has no password yet; runtime connection
(`SIGNAL_WRITER_DATABASE_URL`, pooler) is wired at the ingestion milestone, with
the role password set by the user in the dashboard (Claude never handles it).

**Technical learning (viva)** — Why privilege separation beats prompt-based
guarantees; what `BYPASSRLS` does and why it is safe here (no grants on human
tables); how `SET ROLE` proves the boundary without a login; why RLS + grants are
complementary (RLS governs the PostgREST anon/authenticated path, grants govern
the direct `signal_writer` path).

**Documentation updated** — CURRENT-STATE, 03-NINE-CHECKS (08), this journal.

**Next step** — First ingestion vertical slice for ONE account: Google News RSS
adapter → normalize → dedup (content_hash) → entity match → 3-day filter →
Gemini classify/extract (validated JSON) → score → write signal rows → render.

---

## 2026-10-12 — M3: Ingestion pipeline (compute verified live)
**Objective** — Build the end-to-end pipeline that turns live news into scored,
explained, source-linked signals with outreach angles.

**Approach** — Separated pure compute (`computeAccountSignals`) from persistence
(`persistAccountResults`) so compute is testable without DB creds. Sources:
Google News RSS (primary) + NewsAPI (enrichment, fails soft). Normalize →
content_hash dedup → entity match (name/alias, threshold 0.6) → analyze most
recent N (bounded Gemini cost) → deterministic score. A dry-run mode on
`/api/ingest` returns compute results as JSON for verification pre-persistence.

**Key decisions / findings (live)** —
- Gemini `gemini-3.8-flash` is a *thinking* model; `thinkingConfig.thinkingBudget=0`
  + `responseSchema` gives clean structured JSON (validated: HTTP 200, non-empty).
- RSS links are Google News redirects; publisher parsed from the "… - Publisher"
  title suffix. LinkedIn deliberately excluded (not compliantly accessible).
- Freshest news for the seeded companies is ~3 weeks old here, so a 14-day decay
  scored everything 0. Introduced **two time horizons**: a configurable warmth
  decay (`SIGNAL_DECAY_DAYS`, default 30) for the dashboard score, and a strict
  3-day window for the Hot List. Scores are shown honestly (an old operational
  signal scores low — the decay working as intended).
- Verified discrimination: Gemini marked "Zepto Cafe cuts footprint after
  expansion" relevant (operational + outreach angle) and rejected food-safety and
  gender-bias stories — intelligence, not a news feed.

**Changes** — `lib/types.ts`, `lib/env.ts`, `lib/supabase/read.ts`,
`lib/db/writer.ts` (allowlisted writes as `signal_writer`), `lib/ingestion/*`
(sources, normalize, match), `lib/ai/*` (gemini, analyze), `lib/scoring/score.ts`,
`lib/pipeline.ts`, `lib/data.ts`, `app/api/ingest/route.ts`, `app/page.tsx`,
migration `0003_dashboard_view.sql`, next.config cleanup (removed experimental
cacheComponents so `dynamic` works).

**Verification** — `/api/ingest?account=Zepto` returned real analyzed signals;
`npm run build` passes (TypeScript clean; `/` + `/api/ingest` dynamic).

**Trade-offs / pending** — Persistence needs `SIGNAL_WRITER_DATABASE_URL`
(user sets `signal_writer` password + pooler string). Until then the app computes
but does not write.

**Documentation updated** — CURRENT-STATE, NEXT-STEPS, this journal.

**Next step** — Wire the write connection, run a full ingestion, then build the
Mon/Thu Hot List selection (strict 3-day window) + Resend email + idempotent run.

---

## 2026-10-12 — M3 demo + M4: Hot List
**Objective** — Populate the dashboard with real data and build the Mon/Thu Hot
List (strict 3-day window, top ≤10, Gemini outreach, Resend, idempotent).

**Approach** — Policy blocked Claude from setting the `signal_writer` password
(secret-store write), so the demo data was persisted via the proven
`SET ROLE signal_writer` admin path (re-proving the boundary during real writes).
Added `is_relevant` to `signal_analyses` and a `get_hotlist(p_days)` SQL function
(strict window, ranked by score). Email rendered as inline-styled HTML; Resend
sender with a preview fallback so the flow runs without a key. Idempotency via
`unique(run_date, kind)` + a claim/finalize pair in the writer.

**Changes** — migration `0004_hotlist.sql`; `lib/hotlist/select.ts`,
`lib/notifications/email.ts`, `lib/notifications/hotlist.ts`;
`lib/db/writer.ts` (+is_relevant, claim/finalize run); routes `/api/hotlist`,
`/api/cron/hotlist`, `/api/cron/ingest`; `app/hotlist/page.tsx`; `vercel.json`;
`docs/13-DEPLOYMENT.md`.

**Verification (live)** —
- Dashboard populated: Ola Electric 33, PhonePe 28, Zepto 11; 7 quiet; human
  CRM fields unchanged after writes.
- Hot List preview = **only Ola Electric** (Oct 9 within 3 days); Sep signals
  excluded → "fewer than 10, never invent". Email HTML renders.
- Idempotency proof passed: duplicate same-day `notification_runs` insert blocked
  by the unique constraint; `signal_writer` can write `notification_runs`.
- `npm run build` passes (6 routes).

**Trade-offs / pending** — Actual email send needs `RESEND_API_KEY` +
`HOTLIST_TO_EMAIL`; cron run-recording + app-driven ingestion need
`SIGNAL_WRITER_DATABASE_URL`. Hobby 60s function cap may require batched ingestion.

**Technical learning (viva)** — Two time horizons (configurable warmth decay vs
strict 3-day Hot List); why idempotency is a DB constraint not app logic; why
Resend preview-mode keeps the pipeline testable; Hobby cron limits + fallback.

**Documentation updated** — CURRENT-STATE, NEXT-STEPS, 13-DEPLOYMENT, this journal.

**Next step** — Deploy to Vercel (env + cron) and verify on the public URL; then
the Components Map.

---

## 2026-10-12 — M5: Vercel deployment
**Objective** — Ship a working public URL serving real data.

**Approach** — Vercel CLI wasn't authenticated (interactive login), so used the
Vercel connector. Created project `signaldesk` git-linked to `mvednt/signaldesk`
(auto-deploy on push), framework nextjs, with the **public** env vars only
(Supabase URL + publishable key, GEMINI_MODEL, APP_TIMEZONE) — Claude is blocked
by policy from writing secret env vars, so those are added by the user. Disabled
Vercel Authentication (`ssoProtection: null`) so the URL is truly public. Triggered
a production deployment from `main`.

**Verification (live)** — Deployment `dpl_EyuZomGG…` state READY in ~34s. Public
URL https://signaldesk-vedanth3.vercel.app returns 200 and the HTML contains the
real dashboard (SignalDesk, Ola Electric, PhonePe, "3 warm this cycle").

**Trade-offs / pending** — Reads work publicly now; app-driven ingestion, Hot List
email and cron need the secret env vars added on Vercel. The connector maps to
scope `vedanth3`; an explicit team id was rejected (use default scope).

**Technical learning (viva)** — Why only reads work without secrets (NEXT_PUBLIC
vars inline at build; server AI/DB paths need secrets); why SSO protection must be
off for a public assessment URL; git-linked project auto-deploys future pushes.

**Documentation updated** — README, CURRENT-STATE, this journal, NEXT-STEPS.

**Next step** — Components Map (exec + technical); add Vercel secrets for full
production function.
