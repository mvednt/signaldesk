-- Surface the escalation's auto-drafted outreach on the dashboard view so the
-- drawer can show it (and the 70+ one-click send can use it).
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
  ac.hq as company_hq, ac.headcount as company_headcount,
  esc.escalated_at as escalated_at,
  esc.draft_subject as escalation_draft_subject,
  esc.draft_body as escalation_draft_body
from accounts a
left join account_crm c on c.account_id = a.id
left join account_signal_scores s on s.account_id = a.id
left join signal_events se on se.id = s.top_signal_event_id
left join signal_analyses sa on sa.signal_event_id = se.id
left join outreach_feedback of on of.signal_event_id = se.id
left join account_contacts ac on ac.account_id = a.id
left join account_escalations esc on esc.signal_event_id = se.id
left join lateral (
  select angle_text from outreach_suggestions o
  where o.signal_event_id = se.id
  order by created_at desc limit 1
) os on true;
grant select on account_dashboard to anon, authenticated;
