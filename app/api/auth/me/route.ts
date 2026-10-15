// Returns the signed-in user (or null) for the client-side gate in Shell.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { googleConfigured } from "@/lib/auth/google";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user, configured: googleConfigured() });
}
