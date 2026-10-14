// Apollo.io company enrichment — the "where to reach" layer. Uses the
// Organization Enrichment endpoint (available on the free plan); People Search
// is a paid endpoint, so the PERSON to reach comes from Gemini reading the
// article, not from Apollo. Returns null on any failure (never throws).
import { requireServerEnv } from "@/lib/env";

export interface OrgContact {
  company_linkedin: string | null;
  website: string | null;
  phone: string | null;
  hq: string | null;
  headcount: number | null;
}

function httpUrl(u: unknown): string | null {
  if (typeof u !== "string" || !u) return null;
  return u.startsWith("http") ? u : `https://${u}`;
}

export async function enrichOrganization(domain: string | null): Promise<OrgContact | null> {
  const { apolloApiKey } = requireServerEnv();
  if (!apolloApiKey || !domain) return null;
  try {
    const res = await fetch(
      `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
      { method: "POST", headers: { "Content-Type": "application/json", "X-Api-Key": apolloApiKey } }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { organization?: Record<string, unknown> };
    const o = json.organization;
    if (!o) return null;
    const phoneRaw = o.primary_phone ?? o.phone;
    const phone =
      typeof phoneRaw === "string" ? phoneRaw : (phoneRaw as { number?: string } | undefined)?.number ?? null;
    const hq = [o.city, o.state, o.country].filter(Boolean).join(", ") || null;
    return {
      company_linkedin: httpUrl(o.linkedin_url),
      website: httpUrl(o.website_url),
      phone,
      hq,
      headcount: typeof o.estimated_num_employees === "number" ? o.estimated_num_employees : null,
    };
  } catch {
    return null;
  }
}
