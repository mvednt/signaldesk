# CURRENT-STATE

_Last updated: 2026-10-12_

## Phase
**Milestone 2 — Database foundation** (complete). Next: first ingestion slice.

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

## Blocked
- _None._

## Resolved earlier this session
- Paused `aangan-front-desk` (ref `lyqysxyvxziwfohkimgd`) to free a free-tier
  slot. **Reversible — restore it after submission.**
- Created Supabase project **`signaldesk`** (ref `jyoshntmhccxcxbbjqtb`,
  region `ap-south-1`, ACTIVE_HEALTHY).

## Not started
- Supabase client wiring in the app (`lib/supabase/`); runtime write path as
  `signal_writer` (needs role password set in dashboard → `SIGNAL_WRITER_DATABASE_URL`).
- Source adapters (RSS + NewsAPI), normalization, dedup, entity matching.
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
