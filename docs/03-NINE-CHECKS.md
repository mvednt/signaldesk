# 03 · Nine Checks — Does This Deserve to Be Built?

First-pass assessment (2026-10-12). Status values: **YES / NO / UNVALIDATED**.
Honest by design — not everything is YES. Updated as evidence accrues.

## Kill Switches — any NO means don't build it as proposed
### 01 · Problem real? — YES (assignment) / plausible (independent)
Poorly-timed enterprise outreach is a well-documented sales problem; trigger-based
selling is an established discipline. *Assumption:* Arjun's specific pain is taken
from the brief, not independently measured.

### 02 · Workflow repeated? — YES
Decision recurs twice weekly, indefinitely, across up to 40 companies. Clearly
repetitive enough to justify automation.

### 03 · Input available? — PARTIAL / UNVALIDATED  ⚠ key risk
- News is accessible: **Google News RSS** (free, no key, production-safe) returns
  per-company results. **NewsAPI.org** key validated (HTTP 200) but its free tier
  is **development-only** (24h delay, blocked from production) → RSS is primary.
- **LinkedIn**: not compliantly accessible on free tiers → excluded from
  automated ingestion; optional manual entry only.
- *To validate:* real signal coverage/freshness for 10 specific Indian
  mid-market companies. Test early on the actual watchlist.

## Sizing — any NO means build something smaller / more valuable
### 04 · Output valuable? — YES
Arjun gets a ranked shortlist + evidence + a concrete outreach angle — directly
usable, not just a news feed.

### 05 · Impact measurable? — YES (via proxies, not proven sales lift)
Proxies: research time saved, relevant events found, freshness of top signals,
duplicate rate, high-priority precision (spot-checked), action-acceptance, run
reliability. We will not claim proven revenue impact.

### 06 · ROI worth it? — YES at this scale
Sources free (RSS) / free-tier (NewsAPI), Gemini Flash cheap, Supabase + Vercel +
Resend free tiers. Build cost is engineering time. *Assumption:* volume stays at
~40 companies, a few hundred Gemini calls/week.

## Boundary — any NO means put a human exactly there
### 07 · Failure risk OK? — only WITH controls (several now implemented)
Risks: false positives, wrong-company matching, stale news, fabricated inference,
duplicate events, email failures, prompt injection from fetched pages. Controls
(implemented): confidence + source URL shown per signal, entity-match threshold
(0.6), extract-only-from-source prompting + Zod validation, `content_hash` dedup,
**idempotent Hot List** (`unique(run_date,kind)` — proven: duplicate same-day send
blocked), recency decay so stale news falls in rank, fetched text treated as
untrusted data (prompt-injection note in the analyze prompt). **Human stays in the
loop on sending outreach** — the system drafts, Arjun sends.

### 08 · Judgment protected? — YES (by architecture, PROVEN 2026-10-12)
Human-owned CRM fields live in separate tables (`account_crm`, `contact_history`)
written only by Arjun. The automated path runs as Postgres role `signal_writer`
which has **no privileges** on those tables. **Live proof:** as `signal_writer`,
`UPDATE account_crm` → `permission denied (42501)`; `INSERT signal_events` →
allowed; Arjun's note + last_contact unchanged. Reproducible via
`supabase/tests/preservation_proof.sql` (release blocker). Not reliant on prompting.

### 09 · Owner clear? — YES
Arjun: watchlist curation, CRM notes, final outreach decision. System: ingestion,
scoring, signal-derived writes, Hot List. Operator (student): sources, deployment,
monitoring, failure response. Documented per run via `ingestion_runs` /
`notification_runs`.

## How the Nine Checks changed the build (running list)
- Check 03 → RSS is the **primary** source (NewsAPI demoted to dev enrichment);
  LinkedIn excluded from automated ingestion.
- Check 07 → system **drafts** outreach; a human sends. Confidence + source
  evidence surfaced in the UI.
- Check 08 → human/system table separation + restricted DB role + preservation
  test as a release blocker (architectural, not prompt-based).
