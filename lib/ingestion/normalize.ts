// Normalize raw articles and compute a stable content_hash for dedup/idempotency.
import { createHash } from "crypto";
import type { NormalizedSignal, RawArticle } from "@/lib/types";

export function cleanTitle(title: string): string {
  const dash = title.lastIndexOf(" - ");
  const base = dash > 0 ? title.slice(0, dash) : title;
  return base.replace(/\s+/g, " ").trim();
}

/** Same story across sources/days should collapse: hash on title + day + publisher. */
export function contentHash(ct: string, publishedAt: string | null, publisher: string | null): string {
  const day = (publishedAt ?? "").slice(0, 10);
  const key = `${ct.toLowerCase()}|${day}|${(publisher ?? "").toLowerCase()}`;
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}

export function normalize(raw: RawArticle): NormalizedSignal {
  const ct = cleanTitle(raw.title);
  return { ...raw, cleanTitle: ct, contentHash: contentHash(ct, raw.publishedAt, raw.publisher) };
}

export function normalizeAll(raws: RawArticle[]): NormalizedSignal[] {
  const seen = new Set<string>();
  const out: NormalizedSignal[] = [];
  for (const r of raws) {
    if (!r.title || !r.url) continue;
    const n = normalize(r);
    if (seen.has(n.contentHash)) continue; // in-batch dedup
    seen.add(n.contentHash);
    out.push(n);
  }
  return out;
}

export function isWithinDays(publishedAt: string | null, days: number): boolean {
  if (!publishedAt) return false;
  const t = Date.parse(publishedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 864e5;
}
