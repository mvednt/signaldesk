// Google sign-in session: a signed, HttpOnly cookie. Server-only.
//
// This is identity only — it replaces the old demo username/password gate so
// anyone can sign in with their own Google account. It does NOT touch the send
// pipeline (Resend) or any "Arjun" persona in the app; it just records who is
// signed in and exposes their email so outreach can carry it as Reply-To.
import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

export const SESSION_COOKIE = "sd_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  email: string;
  name: string;
  picture?: string;
};

type SessionPayload = SessionUser & { iat: number };

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (set a 32+ char random string in .env.local).");
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update(data).digest());
}

/** Produce the signed cookie value for a user. */
export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = { ...user, iat: Date.now() };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

/** Verify a cookie value and return the user, or null if invalid/expired. */
export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  // Constant-time compare against the expected signature.
  const expected = sign(body);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.iat !== "number" || Date.now() - payload.iat > MAX_AGE_SECONDS * 1000) return null;
    if (!payload.email) return null;
    return { email: payload.email, name: payload.name, picture: payload.picture };
  } catch {
    return null;
  }
}

/** Read the signed-in user from the request cookies (Server Components / Actions / Route Handlers). */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    return verifySessionToken(store.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
