// Entity resolution: does this article actually concern THIS account?
// Google News is queried per-company, but results can be tangential or name-collide,
// so we require the account name/alias to appear and score a confidence.
import type { Account, MatchResult, NormalizedSignal } from "@/lib/types";

const STOP = new Set(["the", "ltd", "limited", "inc", "pvt", "private", "technologies", "ventures", "company"]);

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
}

export function matchAccount(account: Account, signal: NormalizedSignal): MatchResult {
  const hay = `${signal.cleanTitle} ${signal.snippet ?? ""}`.toLowerCase();
  const names = [account.name, ...(account.aliases ?? [])];

  // 1) Whole name/alias appears verbatim → strongest.
  for (const n of names) {
    if (n.length >= 3 && hay.includes(n.toLowerCase())) {
      return { confidence: 0.95, reason: `matched name/alias "${n}"` };
    }
  }

  // 2) All significant tokens of the primary name present (not contiguous).
  const nameToks = tokens(account.name);
  if (nameToks.length > 0 && nameToks.every((t) => hay.includes(t))) {
    return { confidence: 0.7, reason: `all name tokens present (${nameToks.join(" ")})` };
  }

  // 3) Weak / no match → caller should drop below threshold.
  return { confidence: 0.2, reason: "no reliable name match" };
}

export const MATCH_THRESHOLD = 0.6;
