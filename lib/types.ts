// Shared domain types for the SignalDesk pipeline.

export type SignalSource = "google_news_rss" | "newsapi" | "manual";

export type SignalCategory =
  | "headcount"
  | "leadership"
  | "funding"
  | "digitalisation"
  | "operational"
  | "other";

export interface Account {
  id: string;
  name: string;
  domain: string | null;
  aliases: string[];
  industry: string | null;
  hq_city: string | null;
  monitoring_enabled: boolean;
}

export interface RawArticle {
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: string | null; // ISO
  snippet: string | null;
  source: SignalSource;
}

export interface NormalizedSignal extends RawArticle {
  cleanTitle: string;
  contentHash: string;
}

export interface MatchResult {
  confidence: number; // 0..1
  reason: string;
}

// Gemini structured output (validated with Zod before use).
export interface Analysis {
  is_relevant: boolean;
  category: SignalCategory;
  factual_claim: string;
  relevance_explanation: string;
  confidence: number; // 0..1
  outreach_angle: string;
  contact_name: string;  // person named in the article (e.g. a new CHRO), else ""
  contact_title: string; // that person's role, else ""
}

export interface ScoreComponents {
  score: number; // 0..100
  recency: number;
  trigger: number;
  source: number;
  match: number;
  topContentHash: string | null;
}
