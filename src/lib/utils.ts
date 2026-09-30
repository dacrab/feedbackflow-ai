import { twMerge } from "tailwind-merge";
import { HIGH_SEVERITY_THRESHOLD } from "@/lib/constants";
import type { Sentiment } from "@/lib/types";

export function cn(...inputs: (string | undefined | null | false | 0)[]) {
  return twMerge(...inputs);
}

// React strips server-thrown messages in production, replacing them with this.
// Detected so callers fall back to their own copy.
const RSC_REDACTED_PREFIX = "An error occurred in the Server Components render";

export function handleActionError(e: unknown, fallback = "Action failed") {
  if (e instanceof Error && e.message && !e.message.startsWith(RSC_REDACTED_PREFIX)) {
    return e.message;
  }
  return fallback;
}

type SeverityBand = "high" | "medium" | "low";

/** HIGH is shared with the notify/alerts path, so both agree on "critical". */
const MEDIUM_SEVERITY = 3;

const SEV_BAND_COLOR: Record<SeverityBand, string> = {
  high: "text-danger",
  medium: "text-warn",
  low: "text-muted-foreground",
};

function sevBand(severity: number): SeverityBand {
  if (severity >= HIGH_SEVERITY_THRESHOLD) return "high";
  if (severity >= MEDIUM_SEVERITY) return "medium";
  return "low";
}

export const sevColor = (severity: number) => SEV_BAND_COLOR[sevBand(severity)];
export const sevLabel = (severity: number) => `${sevBand(severity)} severity`;

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  positive: "text-good",
  neutral: "text-muted-foreground",
  negative: "text-danger",
};

export const sentimentColor = (sentiment: Sentiment) => SENTIMENT_COLOR[sentiment];

export const formatDateUTC = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** "2026-06-15" -> "06-15" (chart axis label; the year is always the current one). */
export const formatShortDate = (day: string) => day.slice(5);

const MINUTE_SEC = 60;
const HOUR_SEC = 60 * MINUTE_SEC;
const DAY_SEC = 24 * HOUR_SEC;
const HOUR_MS = HOUR_SEC * 1000;

export const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR_MS);

export function timeAgo(date: Date | string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < MINUTE_SEC) return `${s}s ago`;
  if (s < HOUR_SEC) return `${Math.floor(s / MINUTE_SEC)}m ago`;
  if (s < DAY_SEC) return `${Math.floor(s / HOUR_SEC)}h ago`;
  return `${Math.floor(s / DAY_SEC)}d ago`;
}

export interface RetryOptions {
  retries: number;
  baseDelay: number;
  /** Stop retrying as soon as an error matches — retrying can't help. */
  abortOn?: RegExp;
  signal?: AbortSignal;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const attempts = Math.max(0, opts.retries) + 1;
  let lastErr: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (opts.signal?.aborted) break;
      if (opts.abortOn?.test(String(err))) break;
      if (attempt < attempts - 1) {
        await new Promise((r) => setTimeout(r, opts.baseDelay * (attempt + 1)));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
