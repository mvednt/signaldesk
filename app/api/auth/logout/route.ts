// Clears the session cookie and returns to the app (shows the sign-in screen).
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { originFromRequest } from "@/lib/auth/google";

export const runtime = "nodejs";

function clear(req: Request) {
  const origin = originFromRequest(req);
  const res = NextResponse.redirect(origin + "/");
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const GET = clear;
export const POST = clear;
