-- SignalDesk initial schema
-- Human-owned vs system-owned separation + DB-level preservation guarantee.
-- The signal_writer role is created WITHOUT a password here (no secret in git);
-- its password is set out-of-band (see docs/HANDOFF.md / .env.local).

create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============================================================
-- SHARED IDENTITY (config; changes rarely)
-- ============================================================
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  aliases text[] not null default '{}',
  industry text,
  hq_city text,
  monitoring_enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists accounts_domain_key
  on accounts (lower(domain)) where domain is not null;

-- ============================================================
-- HUMAN-OWNED  (only Arjun writes — automation must never touch)
-- ============================================================
create table if not exists account_crm (
  account_id uuid primary key references accounts(id) on delete cascade,
  relationship_stage text,          -- outreach | pilot | customer | expansion | dormant
  relationship_notes text,
  last_contact_at timestamptz,
  next_step text,
  priority_override int,            -- Arjun can pin an account's priority
  updated_by text default 'arjun',
  updated_at timestamptz not null default now()
);
drop trigger if exists account_crm_touch on account_crm;
create trigger account_crm_touch before update on account_crm
  for each row execute function set_updated_at();

create table if not exists contact_history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  contacted_at timestamptz not null default now(),
  channel text,
  note text,
  created_by text default 'arjun'
);
create index if not exists contact_history_account on contact_history(account_id, contacted_at desc);

-- ============================================================
-- SYSTEM-OWNED  (only signal_writer writes)
-- ============================================================
create table if not exists signal_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  source text not null,              -- google_news_rss | newsapi | manual
  source_url text,
  title text not null,
  raw_excerpt text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  content_hash text not null unique, -- dedup + idempotent ingestion
  status text not null default 'new' -- new | analyzed | rejected
);
create index if not exists signal_events_account_pub
  on signal_events(account_id, published_at desc);

create table if not exists signal_analyses (
  id uuid primary key default gen_random_uuid(),
  signal_event_id uuid not null unique references signal_events(id) on delete cascade,
  category text,                     -- headcount|leadership|funding|digitalisation|operational|other
  factual_claim text,
  relevance_explanation text,
  confidence numeric(3,2),           -- 0..1
  model text,
  prompt_version text,
  created_at timestamptz not null default now()
);

create table if not exists account_signal_scores (
  account_id uuid primary key references accounts(id) on delete cascade,
  score numeric(6,2) not null default 0,
  recency_component numeric(6,2) not null default 0,
  trigger_component numeric(6,2) not null default 0,
  source_component numeric(6,2) not null default 0,
  match_component numeric(6,2) not null default 0,
  top_signal_event_id uuid references signal_events(id) on delete set null,
  computed_at timestamptz not null default now()
);

create table if not exists outreach_suggestions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  signal_event_id uuid references signal_events(id) on delete cascade,
  angle_text text not null,
  model text,
  prompt_version text,
  is_generated boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists outreach_account on outreach_suggestions(account_id, created_at desc);

create table if not exists ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null default 'manual',   -- manual | cron
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',   -- running | success | partial | failed
  accounts_scanned int default 0,
  signals_found int default 0,
  signals_new int default 0,
  errors jsonb not null default '[]'::jsonb
);

create table if not exists notification_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  kind text not null default 'hotlist',
  status text not null default 'pending',   -- pending | sent | failed | skipped
  sent_to text,
  hotlist jsonb,
  error text,
  created_at timestamptz not null default now(),
  unique (run_date, kind)                   -- idempotent Hot List per Mon/Thu
);

-- ============================================================
-- RESTRICTED WRITER ROLE — the preservation guarantee at the DB layer
-- ============================================================
do $$
begin
  if not exists (select from pg_roles where rolname = 'signal_writer') then
    create role signal_writer login;      -- password set out-of-band
  end if;
end $$;
-- BYPASSRLS lets it write system tables without per-row policies, but it still
-- cannot touch human tables because it is granted NO privileges on them.
alter role signal_writer bypassrls;

grant usage on schema public to signal_writer;

-- System-owned tables: full write
grant select, insert, update, delete on
  signal_events, signal_analyses, account_signal_scores,
  outreach_suggestions, ingestion_runs, notification_runs
  to signal_writer;
-- Needs to read account identity to match/resolve, but not change it:
grant select on accounts to signal_writer;

-- Human-owned tables: EXPLICITLY no privileges (belt-and-suspenders; a fresh
-- role has none by default, but we make the intent explicit and auditable).
revoke all on account_crm from signal_writer;
revoke all on contact_history from signal_writer;

-- ============================================================
-- RLS — public (anon) may read for the dashboard; writes to human tables
-- only via an authenticated (Arjun) session; no anon writes anywhere.
-- ============================================================
alter table accounts               enable row level security;
alter table account_crm            enable row level security;
alter table contact_history        enable row level security;
alter table signal_events          enable row level security;
alter table signal_analyses        enable row level security;
alter table account_signal_scores  enable row level security;
alter table outreach_suggestions   enable row level security;
alter table ingestion_runs         enable row level security;
alter table notification_runs      enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'accounts','account_crm','contact_history','signal_events','signal_analyses',
    'account_signal_scores','outreach_suggestions','ingestion_runs','notification_runs'
  ] loop
    execute format('drop policy if exists %I_read on %I', t, t);
    execute format('create policy %I_read on %I for select to anon, authenticated using (true)', t, t);
  end loop;
end $$;

-- Only authenticated (Arjun) may write his own CRM tables.
drop policy if exists account_crm_write on account_crm;
create policy account_crm_write on account_crm for all to authenticated
  using (true) with check (true);
drop policy if exists contact_history_write on contact_history;
create policy contact_history_write on contact_history for all to authenticated
  using (true) with check (true);
