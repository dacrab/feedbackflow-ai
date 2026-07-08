import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false | 0)[]) {
  return twMerge(...inputs);
}

export function handleActionError(e: unknown, fallback = "Action failed") {
  return e instanceof Error ? e.message : fallback;
}

export const sevColor = (severity: number) =>
  severity >= 4 ? "text-red-500" : severity >= 3 ? "text-orange-500" : "text-muted-foreground";

export const sevLabel = (severity: number) =>
  severity >= 4 ? "high severity" : severity >= 3 ? "medium severity" : "low severity";

const sentColorMap: Record<string, string> = {
  positive: "text-green-500",
  negative: "text-red-500",
};
export const sentColor = (sentiment: string) => sentColorMap[sentiment] ?? "text-muted-foreground";

export const formatDateUTC = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const getDateNHoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3600000).toISOString();

export function timeAgo(date: Date | string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
