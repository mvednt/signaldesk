# SignalDesk

**B2B Account Signal Intelligence** — MESA AI & Applications end-term (Problem 18:
B2B Account Signal Monitor).

SignalDesk monitors public signals (news / press / RSS) for a salesperson's
account watchlist, uses **Gemini Flash** to classify each signal, explain why it
matters, and draft an outreach angle, scores and ranks accounts, and emails a
**Hot List** every Monday and Thursday morning — the 10 accounts with the
strongest signals from the last 3 days. It never overwrites the salesperson's own
CRM notes; it writes only what it discovers.

> One question it answers: **which accounts should I contact right now, what
> happened, why now, and what should I say?**

## Stack
Next.js (App Router) · TypeScript · Tailwind · Supabase Postgres · Gemini Flash
(`gemini-3.8-flash`) · Resend · deployed on Vercel.

## Hard rules
- Runtime AI is **Gemini Flash only** — no Claude API at runtime.
- Human-owned CRM fields are **never overwritten** (enforced by architecture).
- Live external data; public Vercel URL; this GitHub repo; a Components Map.

## Getting started
```bash
cp .env.example .env.local   # fill in real values
npm install
npm run dev
```

## Docs
Start with [`docs/00-START-HERE.md`](docs/00-START-HERE.md). Engineering guide:
[`AGENTS.md`](AGENTS.md). Current status: [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md).

_Status: Foundation milestone — see CURRENT-STATE._
