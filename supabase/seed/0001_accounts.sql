-- Seed: 10 real Indian companies for Arjun's active portfolio.
-- Chosen for plausible workforce-management triggers (logistics, quick-commerce,
-- retail expansion, gig/ops-heavy, manufacturing) and strong Indian news footprint.
-- Human-owned CRM rows are illustrative of Arjun's own judgment; edit freely.
-- Run once on a fresh database.

insert into accounts (name, domain, aliases, industry, hq_city) values
  ('Delhivery',      'delhivery.com',   array['Delhivery','Delhivery Limited'],                 'Logistics',        'Gurugram'),
  ('Urban Company',  'urbancompany.com',array['Urban Company','UrbanClap'],                     'Home services',    'Gurugram'),
  ('Zepto',          'zeptonow.com',    array['Zepto','Kiranakart','Zepto Now'],                'Quick commerce',   'Bengaluru'),
  ('Lenskart',       'lenskart.com',    array['Lenskart','Lenskart Solutions'],                 'Retail (eyewear)', 'Gurugram'),
  ('Rapido',         'rapido.bike',     array['Rapido','Roppen Transportation'],                'Mobility (gig)',   'Bengaluru'),
  ('BigBasket',      'bigbasket.com',   array['BigBasket','Supermarket Grocery Supplies'],      'Grocery/logistics','Bengaluru'),
  ('Meesho',         'meesho.com',      array['Meesho','Fashnear Technologies'],                'E-commerce',       'Bengaluru'),
  ('Ola Electric',   'olaelectric.com', array['Ola Electric','Ola Electric Mobility'],          'EV manufacturing', 'Bengaluru'),
  ('PhonePe',        'phonepe.com',     array['PhonePe'],                                       'Fintech',          'Bengaluru'),
  ('Nykaa',          'nykaa.com',       array['Nykaa','FSN E-Commerce Ventures'],               'Retail/beauty',    'Mumbai');

insert into account_crm (account_id, relationship_stage, relationship_notes, last_contact_at, next_step)
select a.id, v.stage, v.notes, v.last_contact::timestamptz, v.next_step
from accounts a
join (values
  ('Delhivery',     'customer',   'Live customer since last year. Rolling out to 2 new hubs; VP Ops is our champion.', '2026-09-28', 'Quarterly business review'),
  ('Urban Company', 'pilot',      'Pilot with ops team for partner scheduling. Needs buy-in from new Head of Ops.',   '2026-10-05', 'Share pilot results deck'),
  ('Zepto',         'outreach',   'Cold outreach stage. Scaling dark stores fast - strong fit if we time it right.',  '2026-08-15', 'Find warm intro to People team'),
  ('Lenskart',      'expansion',  'Existing customer. Opening many new stores; opportunity to expand seats.',          '2026-10-02', 'Propose expansion pricing'),
  ('Rapido',        'outreach',   'Early conversations. Gig workforce ops is a natural fit.',                           '2026-07-30', 'Re-engage after Q3'),
  ('BigBasket',     'pilot',      'Warehouse workforce pilot in Bengaluru. Waiting on IT security review.',             '2026-09-18', 'Follow up on security questionnaire'),
  ('Meesho',        'customer',   'Signed customer. Usage steady; watch for expansion into logistics arm.',             '2026-09-25', 'Check in on adoption'),
  ('Ola Electric',  'outreach',   'Target account. Large factory workforce; manufacturing shift-planning angle.',       '2026-06-20', 'Research org before outreach'),
  ('PhonePe',       'pilot',      'Pilot with a single business unit. Expansion depends on CHRO priorities.',           '2026-10-01', 'Align with new CHRO'),
  ('Nykaa',         'customer',   'Customer across warehouse ops. Relationship healthy; low urgency right now.',        '2026-09-10', 'Routine check-in')
) as v(name,stage,notes,last_contact,next_step) on v.name = a.name
on conflict (account_id) do nothing;
