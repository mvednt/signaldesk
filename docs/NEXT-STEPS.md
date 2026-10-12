# NEXT-STEPS

_Last updated: 2026-10-12_ · Prioritized; top item is the critical path.

## ✅ Done (M1–M2)
- Supabase `signaldesk` created; schema applied (0001, 0002); RLS; restricted
  `signal_writer` role; preservation guarantee proven; 10 companies seeded;
  advisors clean.

## P0 — First end-to-end ingestion slice (ONE account)
Google News RSS adapter → normalize → dedup (`content_hash`) → entity match
(name/domain/alias + confidence) → 3-day freshness filter → Gemini
classify/extract (validated JSON, budget output tokens + `thinkingConfig`) →
deterministic score → write `signal_events`/`signal_analyses`/
`account_signal_scores`/`outreach_suggestions` → render.
- **Files:** `lib/supabase/*`, `lib/ingestion/*`, `lib/ai/*`, `lib/scoring/*`,
  an API route `app/api/ingest/route.ts`, a minimal result view.
- **Runtime write path:** connect as `signal_writer` via pooler. **Needs:** user
  sets the `signal_writer` password in Supabase dashboard → paste
  `SIGNAL_WRITER_DATABASE_URL` into `.env.local`. (Reads can use the anon key.)
- **Acceptance:** one real company yields a real, source-linked signal in the DB
  with a Gemini relevance explanation + score, visible in a page.

## P1 — Generate typed Supabase client + Zod schemas
`generate_typescript_types` → `lib/supabase/types.ts`; Zod validators for all
Gemini output and external data.

## P2 — Dashboard, Hot List selection + Resend email + idempotent run log
## P2 — Vercel deploy + cron (verify Hobby limits; GitHub Actions fallback)
## P3 — Components Map (exec + technical), evidence, viva prep
