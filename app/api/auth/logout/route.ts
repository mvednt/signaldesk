// Clears the session cookie and returns to the app (shows the sign-in screen).
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

function clear(req: Request) {
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(origin + "/");
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const GET = clear;
export const POST = clear;
