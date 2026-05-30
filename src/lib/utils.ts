import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false | 0)[]) {
  return twMerge(...inputs.filter(Boolean).map(String));
}

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
