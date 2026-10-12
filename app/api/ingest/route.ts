// Ingestion trigger.
//  GET  /api/ingest?account=Zepto         -> dry run (compute only, no DB writes)
//  POST /api/ingest   (Authorization: Bearer <CRON_SECRET>)  -> full run + persist
// Dry run exists so the pipeline can be verified before the signal_writer
// connection string is configured.
import { NextRequest, NextResponse } from "next/server";
import { getMonitoredAccounts } from "@/lib/data";
import { computeAccountSignals, runIngestion } from "@/lib/pipeline";
import { requireServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const name = new URL(req.url).searchParams.get("account") ?? undefined;
  const accounts = (await getMonitoredAccounts(name)).slice(0, name ? 1 : 3);
  if (accounts.length === 0) return NextResponse.json({ error: "no matching accounts" }, { status: 404 });

  const results = [];
  for (const a of accounts) {
    const c = await computeAccountSignals(a);
    results.push({
      account: c.account.name,
      rawCount: c.rawCount,
      normalizedCount: c.normalizedCount,
      matchedCount: c.matchedCount,
      topContentHash: c.topContentHash,
      analyzed: c.analyzed.map((s) => ({
        contentHash: s.signal.contentHash,
        source: s.signal.source,
        publisher: s.signal.publisher,
        url: s.signal.url,
        title: s.signal.cleanTitle,
        snippet: s.signal.snippet,
        publishedAt: s.signal.publishedAt,
        matchConfidence: s.matchConfidence,
        is_relevant: s.analysis.is_relevant,
        category: s.analysis.category,
        factual_claim: s.analysis.factual_claim,
        relevance: s.analysis.relevance_explanation,
        outreach: s.analysis.outreach_angle,
        confidence: s.analysis.confidence,
        components: s.components,
      })),
    });
  }
  return NextResponse.json({ dryRun: true, results });
}

export async function POST(req: NextRequest) {
  const { cronSecret } = requireServerEnv();
  const auth = req.headers.get("authorization");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const name = new URL(req.url).searchParams.get("account") ?? undefined;
  const accounts = await getMonitoredAccounts(name);
  const trigger = new URL(req.url).searchParams.get("trigger") === "cron" ? "cron" : "manual";
  const summary = await runIngestion(accounts, trigger);
  return NextResponse.json(summary);
}
