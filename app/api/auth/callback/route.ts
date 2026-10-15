// Google redirects here with ?code&state. Verify state, exchange the code for
// the user's profile, set the signed session cookie, and return to the app.
import { NextResponse } from "next/server";
import { exchangeCodeForUser } from "@/lib/auth/google";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("sd_oauth_state="))
    ?.slice("sd_oauth_state=".length);

  if (url.searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/?auth_error=denied`);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?auth_error=state`);
  }

  try {
    const user = await exchangeCodeForUser(code, origin);
    const res = NextResponse.redirect(origin + "/");
    res.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions);
    res.cookies.delete("sd_oauth_state");
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/?auth_error=exchange`);
  }
}
