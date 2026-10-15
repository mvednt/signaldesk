// Starts the Google sign-in flow: set a CSRF `state` cookie, redirect to Google.
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildAuthUrl, googleConfigured } from "@/lib/auth/google";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/?auth_error=not_configured`);
  }
  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(origin, state));
  res.cookies.set("sd_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes to complete sign-in
  });
  return res;
}
