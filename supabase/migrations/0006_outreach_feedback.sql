-- Outreach feedback: Arjun rates each AI-drafted angle (good / bad / improve).
-- Human-owned input: written by crm_writer, read by signal_writer (so future
-- Gemini prompts can learn from it) and by anon (dashboard display).

create table if not exists outreach_feedback (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  signal_event_id uuid not null references signal_events(id) on delete cascade,
  rating text not null check (rating in ('good','bad','improve')),
  created_by text default 'arjun',
  updated_at timestamptz not null default now(),
  unique (signal_event_id)                 -- one current rating per signal
);

alter table outreach_feedback enable row level security;

-- Human writes this (crm_writer, which bypasses RLS); the pipeline reads it.
grant select, insert, update, delete on outreach_feedback to crm_writer;
grant select on outreach_feedback to signal_writer;
grant select on outreach_feedback to anon, authenticated;

drop policy if exists outreach_feedback_read on outreach_feedback;
create policy outreach_feedback_read on outreach_feedback
  for select to anon, authenticated using (true);

drop trigger if exists outreach_feedback_touch on outreach_feedback;
create trigger outreach_feedback_touch before update on outreach_feedback
  for each row execute function set_updated_at();

-- Expose the top signal's id and its current feedback rating on the dashboard view.
create or replace view account_dashboard
with (security_invoker = true) as
select
  a.id as account_id, a.name, a.industry, a.hq_city, a.domain,
  c.relationship_stage, c.relationship_notes, c.last_contact_at, c.next_step, c.priority_override,
  coalesce(s.score, 0) as score,
  s.recency_component, s.trigger_component, s.source_component, s.match_component, s.computed_at,
  se.title as top_title, se.source_url as top_url, se.published_at as top_published_at, se.source as top_source,
  sa.category as top_category, sa.factual_claim as top_claim,
  sa.relevance_explanation as top_relevance, sa.confidence as top_confidence,
  os.angle_text as top_outreach_angle,
  -- new columns appended at the END (create-or-replace view cannot reorder):
  se.id as top_signal_event_id,
  of.rating as top_feedback
from accounts a
left join account_crm c on c.account_id = a.id
left join account_signal_scores s on s.account_id = a.id
left join signal_events se on se.id = s.top_signal_event_id
left join signal_analyses sa on sa.signal_event_id = se.id
left join outreach_feedback of on of.signal_event_id = se.id
left join lateral (
  select angle_text from outreach_suggestions o
  where o.signal_event_id = se.id
  order by created_at desc limit 1
) os on true;

grant select on account_dashboard to anon, authenticated;

-- Add the current feedback rating to the Hot List function. Drop first because
-- create-or-replace cannot change a function's return type (new column added).
drop function if exists get_hotlist(int);
create or replace function get_hotlist(p_days int default 3)
returns table (
  account_id uuid, name text, relationship_stage text, score numeric,
  signal_event_id uuid, title text, source_url text, published_at timestamptz,
  category text, relevance_explanation text, confidence numeric, outreach_angle text,
  feedback text
) language sql stable security invoker as $$
  with recent as (
    select se.account_id, se.id as signal_event_id, se.title, se.source_url, se.published_at,
           sa.category, sa.relevance_explanation, sa.confidence,
           row_number() over (partition by se.account_id order by se.published_at desc) as rn
    from signal_events se
    join signal_analyses sa on sa.signal_event_id = se.id
    where sa.is_relevant = true
      and se.published_at >= now() - make_interval(days => p_days)
  )
  select r.account_id, a.name, c.relationship_stage,
         coalesce(s.score, 0) as score, r.signal_event_id, r.title, r.source_url,
         r.published_at, r.category, r.relevance_explanation, r.confidence,
         os.angle_text as outreach_angle,
         of.rating as feedback
  from recent r
  join accounts a on a.id = r.account_id
  left join account_crm c on c.account_id = r.account_id
  left join account_signal_scores s on s.account_id = r.account_id
  left join outreach_feedback of on of.signal_event_id = r.signal_event_id
  left join lateral (
    select angle_text from outreach_suggestions o
    where o.signal_event_id = r.signal_event_id order by created_at desc limit 1
  ) os on true
  where r.rn = 1
  order by coalesce(s.score, 0) desc, r.published_at desc
  limit 10;
$$;

grant execute on function get_hotlist(int) to anon, authenticated;
