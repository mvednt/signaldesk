// Public, non-secret runtime config the client needs — currently just the
// one-click-send tier, which is editable on the Tuning page.
import { NextResponse } from "next/server";
import { getScoringConfig } from "@/lib/scoring/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getScoringConfig();
  return NextResponse.json({ send_tier: cfg.send_tier });
}
