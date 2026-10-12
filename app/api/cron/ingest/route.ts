// Scheduled ingestion target (Vercel Cron GET + Bearer CRON_SECRET).
// Note: on Vercel Hobby, functions cap at ~60s — for many accounts this should
// process in batches; see docs/13-DEPLOYMENT.md.
import { NextRequest, NextResponse } from "next/server";
import { getMonitoredAccounts } from "@/lib/data";
import { runIngestion } from "@/lib/pipeline";
import { requireServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const { cronSecret } = requireServerEnv();
  const auth = req.headers.get("authorization");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const accounts = await getMonitoredAccounts();
    const summary = await runIngestion(accounts, "cron");
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
