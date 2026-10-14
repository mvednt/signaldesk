-- Company voice persona: a single, editable profile that EVERY AI outreach
-- draft follows (angles, the Improve rewrite, and the escalation draft). Human-
-- owned config — edited by Arjun (crm_writer), read by everyone.

create table if not exists company_voice (
  id text primary key default 'default',
  company_name text not null,
  product text not null,
  value_prop text not null,
  audience text,
  tone text not null,
  sender_name text not null,
  signoff text,
  guidelines text,
  updated_by text default 'arjun',
  updated_at timestamptz not null default now()
);

alter table company_voice enable row level security;
grant select, insert, update, delete on company_voice to crm_writer;
grant select on company_voice to anon, authenticated;
drop policy if exists company_voice_read on company_voice;
create policy company_voice_read on company_voice for select to anon, authenticated using (true);

drop trigger if exists company_voice_touch on company_voice;
create trigger company_voice_touch before update on company_voice
  for each row execute function set_updated_at();

insert into company_voice (id, company_name, product, value_prop, audience, tone, sender_name, signoff, guidelines)
values (
  'default',
  'WorkforceOS',
  'a workforce-management platform — shift scheduling, attendance, and frontline/field/warehouse operations with built-in compliance',
  'keeps frontline labor efficient and compliant as operations scale, without adding headcount to manage it',
  'COOs, VPs of Operations, Heads of People and CHROs at fast-scaling mid-market and enterprise companies in India',
  'warm, concise, consultative; specific over salesy; earns the reply, never pressures; plain language, no buzzwords',
  'Arjun',
  'Arjun · WorkforceOS',
  'Open on the detected trigger in one line. Make one concrete value point tied to that trigger. End with one low-friction ask (a 15-minute call). Keep it under ~90 words. No hype, no "revolutionary", no multiple CTAs.'
)
on conflict (id) do nothing;

-- Store the auto-generated outreach draft (company voice) on each escalation.
alter table account_escalations add column if not exists draft_subject text;
alter table account_escalations add column if not exists draft_body text;
