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
