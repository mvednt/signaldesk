# NEXT-STEPS

_Last updated: 2026-10-12_ · Prioritized; top item is the critical path.

## P0 — Unblock Supabase (needs user decision)
Create project `signaldesk` once a free-tier slot is available.
- **Options:** pause `aangan-front-desk` or `flat-search-section-b` (reversible,
  but its deployed app goes offline until restored); upgrade MESA org to Pro
  (paid); or reuse an existing active project with a dedicated `signaldesk`
  schema (zero impact, mixes data).
- **Acceptance:** `signaldesk` project ACTIVE_HEALTHY; URL + anon + service-role
  keys stored in `.env.local` and Vercel env.

## P0 — Schema with human/system separation + preservation test
- **Human-owned (Arjun writes only):** `account_notes`, `contact_history`,
  `account_relationships` (notes, last_contact_at, relationship stage/commentary).
- **System-owned (service writes only):** `signal_events`, `signal_analyses`,
  `account_signal_scores`, `outreach_suggestions`, `ingestion_runs`,
  `notification_runs`. `accounts` holds stable identity (name, domain, aliases).
- **Enforcement:** restricted DB role for the ingestion path + RLS + explicit
  column write allowlist + idempotent upserts on stable keys.
- **Acceptance:** an integration test seeds human fields, runs the ingestion/
  update path (including retries/duplicates/partial failure), and asserts human
  fields are byte-for-byte unchanged. **Failing this blocks release.**
- **Files:** `supabase/migrations/*`, `supabase/seed/*`, `lib/supabase/*`,
  `tests/integration/preservation.test.ts`.

## P1 — First end-to-end vertical slice (one account)
RSS adapter → normalize → dedup (hash) → entity match → 3-day filter → Gemini
classify/extract (validated JSON) → score → write signal rows → show in UI.
- **Acceptance:** one real company yields a real, source-linked signal visible in
  the dashboard with a relevance explanation and score.

## P1 — Seed the 10 real Indian companies
Claude proposes 10 realistic mid-market/enterprise firms (editable). Store name +
domain + aliases for entity matching.

## P2 — Dashboard, Hot List selection + Resend email + idempotent run log
## P2 — Vercel deploy + cron (verify Hobby limits; GitHub Actions fallback)
## P3 — Components Map (exec + technical), evidence, viva prep
