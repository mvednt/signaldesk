# 01 · Problem Statement (official)

> Source: MESA Cohort C4 "AI and its Applications — Section 1" Final Exam,
> Problem Statement Booklet, Problem 18 — **B2B Account Signal Monitor**
> (High Difficulty · Enterprise Sales · CRM Intelligence · SaaS-able).

## Submission instructions (hard constraints)
1. Solution must use **live external data** wherever possible; it must work with
   real data at submission time.
2. **All AI tasks must use Gemini Flash. Do not use the Claude API.**
3. Deploy on **Vercel**; submit a working public URL, the **GitHub** repo link,
   and the **Components Map**.

## The scenario (as written)
Arjun sells a workforce-management SaaS to mid-market and enterprise companies in
India. He manages **10 active accounts (assume these)** at stages from first
outreach → live pilots → signed customers he is expanding. His biggest challenge
is **timing**: reaching out with no live trigger is noise; reaching out two weeks
after a trigger is too late. He needs to know which accounts are **"warm" this
week**.

A **trigger event** is anything that makes his product relevant *now*:
- headcount expansion,
- a new **CHRO / VP Operations** joining,
- a public statement about **workforce digitalisation**,
- a **funding round** that typically precedes team growth,
- news of an **operational challenge** his product addresses.

These signals appear in **press releases, news articles, and LinkedIn posts**,
scattered across dozens of sources, for **forty companies, every day**.

## What the system must do
- Tell Arjun, **twice a week**, which accounts are worth contacting right now —
  and **why** (what changed, why it's the right moment).
- Accounts that have gone quiet **fall down the priority list automatically**.
- Whatever it writes back to Supabase **must never touch what Arjun wrote
  himself** — his notes, last-contact records, relationship read. "The system
  updates only signal-derived columns." His judgment stays exactly where he left it.
- **Monday and Thursday mornings**: email a **Hot List** — the **ten accounts
  with the strongest signals from the last three days**, each with a one-line
  signal summary and a **Gemini-drafted outreach angle** connecting the detected
  trigger to what Arjun's product does.

## Interpretation notes (ours, flagged as inference)
- **10 vs 40**: Arjun actively manages 10 accounts; signals scatter across up to
  40 companies. We model a watchlist that can hold up to 40 monitored companies,
  with 10 seeded as his active portfolio. We will not imply all 40 are real.
- **LinkedIn**: direct scraping is not compliant/available on free tiers. We will
  NOT fabricate LinkedIn access. Primary sources are news/press/RSS; we can add a
  manual "paste a LinkedIn signal" entry so Arjun can log one himself.
- **Timezone**: Asia/Kolkata assumed for "mornings" (verify before cron config).
