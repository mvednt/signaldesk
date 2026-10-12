# NEXT-STEPS

_Last updated: 2026-10-12_ · Prioritized; top item is the critical path.

## ✅ Done (M1–M3)
- Supabase `signaldesk`; schema (0001–0003); RLS; `signal_writer`; preservation
  proven; 10 companies seeded; advisors clean.
- Ingestion **compute** pipeline (RSS+NewsAPI → normalize/dedup → match → Gemini
  → score) verified live via dry run; dashboard page + `account_dashboard` view;
  `npm run build` passes.

## P0 — Enable persistence + full ingestion run
- **User action:** set `signal_writer` password in Supabase (Database → Roles) +
  paste Transaction-pooler string into `.env.local` as `SIGNAL_WRITER_DATABASE_URL`.
- Then `POST /api/ingest` (Bearer `CRON_SECRET`) persists all accounts.
- **Acceptance:** dashboard shows real scored signals + outreach for ≥1 account;
  re-running does not duplicate (content_hash); a re-run preservation check shows
  human CRM fields unchanged.

## P1 — Hot List (Mon/Thu)
Strict 3-day window selection of top ≤10 accounts → Gemini outreach angle →
Resend email → `notification_runs` (idempotent per run date). Fewer than 10 if
fewer qualify; never invent signals.

## P1 — Vercel deploy + cron (verify Hobby limits; GitHub Actions fallback)

## P2 — Account detail page, signals feed, filters; typed Supabase types

## P2 — Dashboard, Hot List selection + Resend email + idempotent run log
## P2 — Vercel deploy + cron (verify Hobby limits; GitHub Actions fallback)
## P3 — Components Map (exec + technical), evidence, viva prep
