// Mon/Thu Hot List cron target. Vercel Cron sends a GET with
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set in the project.
import { NextRequest, NextResponse } from "next/server";
import { runHotList } from "@/lib/notifications/hotlist";
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
    const result = await runHotList({ send: true });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
