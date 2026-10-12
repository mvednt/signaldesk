# 13 · Deployment (Vercel)

## Environment variables (set in Vercel → Project → Settings → Environment Variables)
Mirror `.env.example`. Required for full function:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — reads.
- `SIGNAL_WRITER_DATABASE_URL` — Supabase **Transaction pooler** string using the
  `signal_writer` role (system-owned writes + cron). Never the service-role key.
- `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.8-flash` — runtime AI.
- `NEWS_API_KEY` — optional enrichment (NewsAPI.org; dev-tier, may be blocked in prod).
- `RESEND_API_KEY`, `HOTLIST_FROM_EMAIL`, `HOTLIST_TO_EMAIL` — Hot List email.
- `CRON_SECRET` — authorizes cron routes. Vercel automatically sends it as
  `Authorization: Bearer $CRON_SECRET` to cron paths when this var is set.
- `APP_TIMEZONE=Asia/Kolkata`, `SIGNAL_DECAY_DAYS` (optional, default 30).

## Cron (`vercel.json`)
```
/api/cron/ingest   30 0 * * *     # daily ~06:00 IST (00:30 UTC)
/api/cron/hotlist  30 1 * * 1,4   # Mon & Thu ~07:00 IST (01:30 UTC)
```
UTC schedules; IST = UTC+5:30. Two crons — fits the Vercel **Hobby** limit (2),
each firing ≤ once/day.

## Known Hobby-plan constraints
- Functions cap at ~60s on Hobby. Full 10-account ingestion may approach this;
  if it times out, batch accounts per cron run (process N, rotate) or upgrade.
  The Hot List cron itself is fast (one RPC + one email).
- Cron firing time is approximate on Hobby. If exact timing matters, trigger the
  cron paths from an external scheduler (e.g. GitHub Actions) hitting them with
  the `CRON_SECRET` bearer.

## Steps
1. Import `mvednt/signaldesk` into Vercel (personal scope).
2. Add env vars (Production + Preview).
3. Deploy; verify the public URL renders the dashboard with live data.
4. Manually hit `/api/cron/hotlist` with the bearer to confirm an email sends and
   a `notification_runs` row is recorded (idempotent on re-run).
