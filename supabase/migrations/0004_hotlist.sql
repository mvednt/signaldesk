-- Hot List support: explicit relevance flag + strict 3-day selection function.

alter table signal_analyses add column if not exists is_relevant boolean not null default true;

-- Top ≤10 accounts whose MOST RECENT relevant signal falls in the last p_days,
-- ranked by current account score. Strict window per the brief (default 3 days).
create or replace function get_hotlist(p_days int default 3)
returns table (
  account_id uuid, name text, relationship_stage text, score numeric,
  signal_event_id uuid, title text, source_url text, published_at timestamptz,
  category text, relevance_explanation text, confidence numeric, outreach_angle text
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
         os.angle_text as outreach_angle
  from recent r
  join accounts a on a.id = r.account_id
  left join account_crm c on c.account_id = r.account_id
  left join account_signal_scores s on s.account_id = r.account_id
  left join lateral (
    select angle_text from outreach_suggestions o
    where o.signal_event_id = r.signal_event_id order by created_at desc limit 1
  ) os on true
  where r.rn = 1
  order by coalesce(s.score, 0) desc, r.published_at desc
  limit 10;
$$;

grant execute on function get_hotlist(int) to anon, authenticated;
