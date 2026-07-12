import { twMerge } from "tailwind-merge";
import { HIGH_SEVERITY_THRESHOLD, MEDIUM_SEVERITY_THRESHOLD } from "@/lib/constants";

export function cn(...inputs: (string | undefined | null | false | 0)[]) {
  return twMerge(...inputs);
}

export function handleActionError(e: unknown, fallback = "Action failed") {
  return e instanceof Error ? e.message : fallback;
}

export const sevColor = (severity: number) =>
  severity >= HIGH_SEVERITY_THRESHOLD
    ? "text-red-500"
    : severity >= MEDIUM_SEVERITY_THRESHOLD
      ? "text-orange-500"
      : "text-muted-foreground";

export const sevLabel = (severity: number) =>
  severity >= HIGH_SEVERITY_THRESHOLD
    ? "high severity"
    : severity >= MEDIUM_SEVERITY_THRESHOLD
      ? "medium severity"
      : "low severity";

const SENTIMENT_COLOR_MAP: Record<string, string> = {
  positive: "text-green-500",
  negative: "text-red-500",
};

export const sentimentColor = (sentiment: string) =>
  SENTIMENT_COLOR_MAP[sentiment] ?? "text-muted-foreground";

export const formatDateUTC = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const HOUR_MS = 3_600_000;

export const getDateNHoursAgo = (hours: number) =>
  new Date(Date.now() - hours * HOUR_MS).toISOString();

export function timeAgo(date: Date | string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

export interface RetryOptions {
  retries: number;
  baseDelay: number;
  abortOn?: RegExp;
  onError?: (err: unknown) => void;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      opts.onError?.(err);
      if (opts.abortOn?.test(String(err))) break;
      if (attempt < opts.retries)
        await new Promise((r) => setTimeout(r, opts.baseDelay * (attempt + 1)));
    }
  }
  throw lastErr;
}
