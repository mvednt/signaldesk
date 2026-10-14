-- "Who / where to reach": the person named in the trigger (from Gemini) plus
-- the company's verified handles (from Apollo org enrichment).

-- Person named in the article (Gemini-extracted).
alter table signal_analyses add column if not exists contact_name text;
alter table signal_analyses add column if not exists contact_title text;

-- Company enrichment ("where to reach"). System-owned (signal_writer writes).
create table if not exists account_contacts (
  account_id uuid primary key references accounts(id) on delete cascade,
  company_linkedin text,
  website text,
  phone text,
  hq text,
  headcount int,
  source text default 'apollo',
  fetched_at timestamptz not null default now()
);
alter table account_contacts enable row level security;
grant select, insert, update, delete on account_contacts to signal_writer;
grant select on account_contacts to anon, authenticated;
drop policy if exists account_contacts_read on account_contacts;
create policy account_contacts_read on account_contacts
  for select to anon, authenticated using (true);

-- Rebuild the dashboard view, appending contact columns at the END.
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
  se.id as top_signal_event_id,
  of.rating as top_feedback,
  sa.contact_name as top_contact_name,
  sa.contact_title as top_contact_title,
  ac.company_linkedin, ac.website as company_website, ac.phone as company_phone,
  ac.hq as company_hq, ac.headcount as company_headcount
from accounts a
left join account_crm c on c.account_id = a.id
left join account_signal_scores s on s.account_id = a.id
left join signal_events se on se.id = s.top_signal_event_id
left join signal_analyses sa on sa.signal_event_id = se.id
left join outreach_feedback of on of.signal_event_id = se.id
left join account_contacts ac on ac.account_id = a.id
left join lateral (
  select angle_text from outreach_suggestions o
  where o.signal_event_id = se.id
  order by created_at desc limit 1
) os on true;
grant select on account_dashboard to anon, authenticated;

-- Hot List: append the named contact (person) for each account's top signal.
drop function if exists get_hotlist(int);
create or replace function get_hotlist(p_days int default 3)
returns table (
  account_id uuid, name text, relationship_stage text, score numeric,
  signal_event_id uuid, title text, source_url text, published_at timestamptz,
  category text, relevance_explanation text, confidence numeric, outreach_angle text,
  feedback text, contact_name text, contact_title text
) language sql stable security invoker as $$
  with recent as (
    select se.account_id, se.id as signal_event_id, se.title, se.source_url, se.published_at,
           sa.category, sa.relevance_explanation, sa.confidence,
           sa.contact_name, sa.contact_title,
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
         of.rating as feedback, r.contact_name, r.contact_title
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
