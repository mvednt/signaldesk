# CURRENT-STATE

_Last updated: 2026-10-12_

## Phase
**PRODUCTION FULLY OPERATIONAL** (2026-10-12). All required deliverables met and
verified live in prod: ingestion writes as `signal_writer`, Hot List email sends
via Resend, human CRM provably untouched. Remaining: optional polish; rotate the
`signal_writer` password (currently a weak demo value).

## Live deployment
- **Public URL:** https://signaldesk-vedanth3.vercel.app (Vercel Authentication
  disabled → publicly viewable). Project `signaldesk` (`prj_IUwictj0Kx5Gts9NN3lvQLKe7klu`),
  git-linked to `mvednt/signaldesk` (auto-deploys on push to `main`).
- Build READY in ~34s; dashboard serves real Supabase data (reads via anon key).
- **Set on Vercel:** NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, GEMINI_MODEL, APP_TIMEZONE.
- **Still to add on Vercel (secrets — user, via dashboard):** GEMINI_API_KEY,
  NEWS_API_KEY, SIGNAL_WRITER_DATABASE_URL, RESEND_API_KEY, HOTLIST_TO_EMAIL,
  CRON_SECRET — needed for live ingestion + Hot List email/cron.

## Implemented & verified
- Next.js (App Router) + TypeScript + Tailwind scaffold; `npm install` clean.
- Git repo; GitHub remote `mvednt/signaldesk` (private).
- Secrets in `.env.local` (gitignored); `.env.example` with names only.
- **Keys validated live (2026-10-12):**
  - Gemini `gemini-3.8-flash` → HTTP 200 (thinking model; budget output tokens).
  - NewsAPI.org key → HTTP 200 (free tier = development-only).
- **Supabase `signaldesk` schema applied** (migrations 0001, 0002):
  - Human-owned: `account_crm`, `contact_history`.
  - System-owned: `signal_events`, `signal_analyses`, `account_signal_scores`,
    `outreach_suggestions`, `ingestion_runs`, `notification_runs`.
  - Shared: `accounts`. RLS on all tables; restricted `signal_writer` role.
- **Preservation guarantee PROVEN live:** as `signal_writer`, `UPDATE account_crm`
  → `permission denied (42501)`; `INSERT signal_events` → allowed; human note +
  last_contact unchanged. Reproducible: `supabase/tests/preservation_proof.sql`.
- **10 real companies seeded** with Arjun's CRM rows (Delhivery, Urban Company,
  Zepto, Lenskart, Rapido, BigBasket, Meesho, Ola Electric, PhonePe, Nykaa).
- Supabase **security advisors: 0 issues**.
- **Ingestion pipeline (M3) built & verified live via `/api/ingest?account=…` dry
  run:** Google News RSS + NewsAPI adapters, normalize + dedup (content_hash),
  entity matching, Gemini Flash classify/relevance/outreach (validated JSON,
  `thinkingBudget:0`), deterministic scoring with configurable recency decay.
  - Zepto dry run: 114 raw → 113 normalized → 99 matched; Gemini correctly flags
    "Zepto Cafe cuts footprint after expansion" as a relevant operational trigger
    and rejects food-safety/gender-bias stories as not workforce-relevant.
- Dashboard page (`app/page.tsx`) renders from the `account_dashboard` view
  (human vs system context visually separated). `npm run build` passes.
- **Hot List (M4):** `get_hotlist(p_days)` RPC (strict 3-day window, top ≤10,
  ranked by score), email render + Resend sender (preview fallback when no key),
  `/hotlist` page, preview route `/api/hotlist` (+`?format=html`), cron routes
  `/api/cron/hotlist` & `/api/cron/ingest` (Bearer `CRON_SECRET`), `vercel.json`
  crons (daily ingest + Mon/Thu Hot List — fits Hobby's 2-cron limit).
  - Verified live: preview returns **only Ola Electric** (Oct 9, within 3 days);
    PhonePe/Zepto (Sep) correctly excluded → demonstrates "fewer than 10, never
    invent". Email HTML renders. **Idempotency proven**: duplicate same-day send
    blocked by `unique(run_date, kind)`.

## Blocked
- _None._

## Resolved earlier this session
- Paused `aangan-front-desk` (ref `lyqysxyvxziwfohkimgd`) to free a free-tier
  slot. **Reversible — restore it after submission.**
- Created Supabase project **`signaldesk`** (ref `jyoshntmhccxcxbbjqtb`,
  region `ap-south-1`, ACTIVE_HEALTHY).

## Demo state (populated 2026-10-12)
- Dashboard is **live and populated with real data** (3 warm accounts via the
  admin `SET ROLE signal_writer` bridge, re-proving the write boundary):
  - **Ola Electric** 33 — "Onboards First 150 Dealers As Network Expansion" (9 Oct)
  - **PhonePe** 28 — "Plans 20,000 Frontline Hires…" (25 Sep, 95% conf)
  - **Zepto** 11 — "Zepto Cafe cuts footprint after expansion" (21 Sep)
  - 7 accounts correctly quiet (no recent trigger). Human CRM fields verified
    unchanged after the writes.

## Production env (all set on Vercel + verified)
- `SIGNAL_WRITER_DATABASE_URL` (aws-0 pooler, role `signal_writer`), `GEMINI_API_KEY`,
  `NEWS_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `HOTLIST_FROM/TO_EMAIL`, and the
  public Supabase/model/timezone vars. The `signal_writer` password is a weak demo
  value — rotate it: `alter role signal_writer with password '<strong>';` and update
  the Vercel var to match. (Actual secrets live only in Vercel + local .env.local.)

## Verified in production (2026-10-12)
- `POST /api/ingest` → writes as `signal_writer` (status success, 0 errors).
- `GET /api/cron/hotlist` → email **sent** via Resend; `notification_runs` = sent,
  idempotent (1/day).
- Human CRM fields unchanged after all writes.
- Hobby note: single-account ingest ~33s; full 10-account cron may approach the
  60s Hobby cap — batch if it times out (see 13-DEPLOYMENT.md).
- Gemini classification/extraction/scoring; signal writes.
- Dashboard, Account detail, Signals feed, Hot List UI.
- Hot List email (Resend) + idempotent run log.
- Vercel deploy + cron; Components Map; viva docs.

## Latest build/deploy status
- Build: scaffold installs; no app code beyond the starter yet.
- Deploy: none yet.

## Key references
- Repo: https://github.com/mvednt/signaldesk
- Supabase: project `signaldesk` / ref `jyoshntmhccxcxbbjqtb` (org MESA)
- Gemini model: `gemini-3.8-flash` · Timezone: Asia/Kolkata
