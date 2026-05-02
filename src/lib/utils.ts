import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export async function notifySlack(text: string, url?: string) {
  const webhook = url || process.env["SLACK_WEBHOOK_URL"];
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Fire-and-forget: Slack notification failures are non-critical
  }
}
