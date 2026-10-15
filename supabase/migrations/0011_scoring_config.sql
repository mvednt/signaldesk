-- Calibratable scoring rubric, editable from the website (the brief asks for the
-- scoring to be "inspectable and calibratable"). Single-row config, HUMAN-owned
-- (written by crm_writer, like company_voice). The pipeline + a recompute read it.

create table if not exists scoring_config (
  id text primary key default 'default',
  category_weights jsonb not null,   -- { leadership, headcount, funding, digitalisation, operational, other }
  source_weights   jsonb not null,   -- { newsapi, google_news_rss, manual }
  decay_days        int   not null default 30,
  match_threshold   numeric(4,2) not null default 0.6,
  escalate_threshold numeric(6,2) not null default 60,
  send_tier         numeric(6,2) not null default 70,
  updated_by text default 'arjun',
  updated_at timestamptz not null default now()
);

drop trigger if exists scoring_config_touch on scoring_config;
create trigger scoring_config_touch before update on scoring_config
  for each row execute function set_updated_at();

-- Seed the current hardcoded defaults as the starting rubric.
insert into scoring_config (id, category_weights, source_weights, decay_days, match_threshold, escalate_threshold, send_tier)
values (
  'default',
  '{"leadership":1.0,"headcount":0.9,"digitalisation":0.75,"funding":0.7,"operational":0.6,"other":0.3}'::jsonb,
  '{"newsapi":0.85,"google_news_rss":0.8,"manual":0.7}'::jsonb,
  30, 0.6, 60, 70
)
on conflict (id) do nothing;

alter table scoring_config enable row level security;
drop policy if exists scoring_config_read on scoring_config;
create policy scoring_config_read on scoring_config for select to anon, authenticated using (true);

grant select on scoring_config to anon, authenticated, signal_writer, crm_writer;
grant insert, update, delete on scoring_config to crm_writer;   -- human-owned config

-- Store the entity-match confidence per signal so OLD signals can be re-scored
-- when the rubric changes (the "recompute now" path), not just future scans.
alter table signal_analyses add column if not exists match_confidence numeric(3,2);

-- Backfill: the top signal of each account already has its match component stored.
update signal_analyses sa
   set match_confidence = s.match_component
  from account_signal_scores s
 where sa.signal_event_id = s.top_signal_event_id
   and sa.match_confidence is null;
