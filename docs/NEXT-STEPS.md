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

## ✅ Done (M4 — Hot List)
Strict 3-day `get_hotlist` RPC, email render + Resend (preview fallback), `/hotlist`
page, preview + cron routes, `vercel.json` crons, idempotency proven. Verified
live (1 qualifying account; fewer-than-10 behavior correct).

## P0 — Deploy to Vercel (see docs/13-DEPLOYMENT.md)
Import repo → set env (incl. `SIGNAL_WRITER_DATABASE_URL`, `RESEND_API_KEY`,
`CRON_SECRET`, `HOTLIST_TO_EMAIL`) → deploy → verify public URL + a real cron hit.

## P1 — Components Map (exec 6-stage + technical) + diagrams
## P1 — Enable app write path end-to-end (connection string) + full ingestion run
## P2 — Account detail page, signals feed, filters; typed Supabase types; viva docs

## P2 — Dashboard, Hot List selection + Resend email + idempotent run log
## P2 — Vercel deploy + cron (verify Hobby limits; GitHub Actions fallback)
## P3 — Components Map (exec + technical), evidence, viva prep
