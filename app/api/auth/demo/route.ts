// Demo sign-in: a one-click fallback for anyone who doesn't want to use Google.
// Signs the session in as the built-in "Arjun" demo persona. Same signed
// session cookie as the Google path — the rest of the app is identical.
import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";

const DEMO_USER = { name: "Arjun", email: "arjun@signaldesk.app" };

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(origin + "/");
  res.cookies.set(SESSION_COOKIE, createSessionToken(DEMO_USER), sessionCookieOptions);
  return res;
}
