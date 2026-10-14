-- crm_writer — the mirror image of signal_writer (migration 0001).
-- signal_writer : writes SYSTEM tables, REVOKE ALL on human tables.
-- crm_writer    : writes HUMAN tables,  REVOKE ALL on system tables.
-- Together they make the write boundary symmetric and enforced by the database:
-- the automation can never touch Arjun's notes, and Arjun's editor can never
-- touch the signal data. The role is created WITHOUT a password here (no secret
-- in git); set it out-of-band (see below / docs/HANDOFF.md / .env.local).

do $$
begin
  if not exists (select from pg_roles where rolname = 'crm_writer') then
    create role crm_writer login;      -- password set out-of-band
  end if;
end $$;

-- BYPASSRLS lets it write the human tables without per-row policies, but it
-- still cannot touch system tables because it is granted NO privileges on them.
-- (Same design as signal_writer: the boundary is table grants, not RLS.)
alter role crm_writer bypassrls;

grant usage on schema public to crm_writer;

-- Human-owned tables: full write.
grant select, insert, update, delete on account_crm, contact_history to crm_writer;
-- Needs to read account identity (FK target), but not change it:
grant select on accounts to crm_writer;

-- System-owned tables: EXPLICITLY no privileges (belt-and-suspenders; a fresh
-- role has none by default, but we make the intent explicit and auditable —
-- the exact mirror of signal_writer's REVOKE on the human tables).
revoke all on
  signal_events, signal_analyses, account_signal_scores,
  outreach_suggestions, ingestion_runs, notification_runs
  from crm_writer;

-- After applying, set the password out-of-band and build the connection string:
--   alter role crm_writer with password '<strong-password>';
-- then put the Transaction-pooler URI in .env.local and Vercel as
--   CRM_WRITER_DATABASE_URL=postgresql://crm_writer:<pw>@<pooler-host>:6543/postgres
