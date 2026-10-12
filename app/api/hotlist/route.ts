// Hot List PREVIEW (no send, no DB write).
//   GET /api/hotlist              -> JSON preview
//   GET /api/hotlist?format=html  -> the rendered email HTML
import { NextRequest, NextResponse } from "next/server";
import { runHotList } from "@/lib/notifications/hotlist";
import { getHotList, runDateInTZ } from "@/lib/hotlist/select";
import { renderHotListEmail } from "@/lib/notifications/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const format = new URL(req.url).searchParams.get("format");
  if (format === "html") {
    const runDate = runDateInTZ();
    const { html } = renderHotListEmail(await getHotList(3), runDate);
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  const result = await runHotList({ send: false });
  return NextResponse.json(result);
}
