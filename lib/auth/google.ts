// Minimal Google OAuth 2.0 (authorization-code) helpers. Identity only:
// scopes are openid/email/profile — NO Gmail API, no sensitive scopes, so the
// OAuth app needs no Google verification to work with test users. Server-only.
import "server-only";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function clientId(): string {
  const v = process.env.GOOGLE_CLIENT_ID;
  if (!v) throw new Error("GOOGLE_CLIENT_ID is not set.");
  return v;
}

function clientSecret(): string {
  const v = process.env.GOOGLE_CLIENT_SECRET;
  if (!v) throw new Error("GOOGLE_CLIENT_SECRET is not set.");
  return v;
}

/** The redirect URI must match one registered in the Google Cloud console.
 *  Derived from the incoming request origin so localhost and prod both work. */
export function redirectUri(origin: string): string {
  return `${origin}/api/auth/callback`;
}

export function buildAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

type GoogleUser = { email: string; name: string; picture?: string };

/** Exchange the auth code for tokens, then fetch the user's profile. */
export async function exchangeCodeForUser(code: string, origin: string): Promise<GoogleUser> {
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  const token = (await tokenRes.json()) as { access_token?: string; error_description?: string; error?: string };
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(token.error_description || token.error || `Token exchange failed (HTTP ${tokenRes.status}).`);
  }

  const infoRes = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const info = (await infoRes.json()) as { email?: string; name?: string; picture?: string; error?: string };
  if (!infoRes.ok || !info.email) {
    throw new Error(info.error || `Could not read Google profile (HTTP ${infoRes.status}).`);
  }
  return { email: info.email, name: info.name || info.email.split("@")[0], picture: info.picture };
}
