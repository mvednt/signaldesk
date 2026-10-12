// Source adapters. Google News RSS is the PRIMARY (free, production-safe).
// NewsAPI.org is optional dev-time enrichment (free tier is development-only).
import Parser from "rss-parser";
import type { Account, RawArticle } from "@/lib/types";
import { requireServerEnv } from "@/lib/env";

const TRIGGER_TERMS =
  '(hiring OR headcount OR CHRO OR "VP Operations" OR "Chief People" OR expansion OR ' +
  'warehouse OR workforce OR layoffs OR funding OR "new plant" OR "new facility" OR ' +
  'digitisation OR digitalisation OR attrition OR recruitment)';

export function buildQuery(account: Account): string {
  const names = [account.name, ...(account.aliases ?? [])].slice(0, 3).map((n) => `"${n}"`);
  return `(${names.join(" OR ")}) ${TRIGGER_TERMS}`;
}

/** Google News RSS — real live data, no key, works from any server. */
export async function fetchGoogleNewsRss(account: Account): Promise<RawArticle[]> {
  const q = encodeURIComponent(buildQuery(account));
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
  const parser = new Parser({ timeout: 15000 });
  const feed = await parser.parseURL(url);
  return (feed.items ?? []).map((i) => {
    const title = (i.title ?? "").trim();
    // Google News titles are "Headline - Publisher".
    const dash = title.lastIndexOf(" - ");
    const publisher = dash > 0 ? title.slice(dash + 3).trim() : null;
    return {
      title,
      url: i.link ?? "",
      publisher,
      publishedAt: i.isoDate ?? null,
      snippet: (i.contentSnippet ?? i.content ?? "").toString().slice(0, 500) || null,
      source: "google_news_rss" as const,
    };
  });
}

/** NewsAPI.org enrichment. Returns [] on any failure (never throws). */
export async function fetchNewsApi(account: Account): Promise<RawArticle[]> {
  const { newsApiKey } = requireServerEnv();
  if (!newsApiKey) return [];
  try {
    const from = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const q = encodeURIComponent(`"${account.name}" ${TRIGGER_TERMS}`);
    const url = `https://newsapi.org/v2/everything?q=${q}&from=${from}&language=en&sortBy=publishedAt&pageSize=20`;
    const res = await fetch(url, { headers: { "X-Api-Key": newsApiKey } });
    if (!res.ok) return [];
    const json = (await res.json()) as { articles?: Array<Record<string, unknown>> };
    return (json.articles ?? []).map((a) => ({
      title: String(a.title ?? "").trim(),
      url: String(a.url ?? ""),
      publisher: (a.source as { name?: string } | undefined)?.name ?? null,
      publishedAt: (a.publishedAt as string) ?? null,
      snippet: (a.description as string)?.slice(0, 500) ?? null,
      source: "newsapi" as const,
    }));
  } catch {
    return [];
  }
}

export async function fetchAllSources(account: Account): Promise<RawArticle[]> {
  const [rss, news] = await Promise.all([
    fetchGoogleNewsRss(account).catch(() => [] as RawArticle[]),
    fetchNewsApi(account).catch(() => [] as RawArticle[]),
  ]);
  return [...rss, ...news];
}
