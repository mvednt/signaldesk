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

## ✅ Done (M5 — Vercel deploy)
Public URL live: https://signaldesk-vedanth3.vercel.app (git-linked, SSO off).
Reads serve real data. Public env vars set.

## P0 — Components Map (exec 6-stage + technical) + diagrams
Required submission deliverable. `docs/05-COMPONENTS-MAP.md`,
`docs/COMPONENTS-MAP-TECHNICAL.md`, diagrams.

## P1 — Add Vercel secrets → full production function
User adds on Vercel: GEMINI_API_KEY, NEWS_API_KEY, SIGNAL_WRITER_DATABASE_URL,
RESEND_API_KEY, HOTLIST_TO_EMAIL, CRON_SECRET. Then hit `/api/cron/ingest` and
`/api/cron/hotlist` with the bearer to verify end-to-end in prod.

## P2 — Account detail page, signals feed, filters; typed Supabase types; viva docs

## P2 — Dashboard, Hot List selection + Resend email + idempotent run log
## P2 — Vercel deploy + cron (verify Hobby limits; GitHub Actions fallback)
## P3 — Components Map (exec + technical), evidence, viva prep
