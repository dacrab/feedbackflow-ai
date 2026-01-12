import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const formatDateUTC = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(iso).toISOString();
  }
};

export const getDateNHoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3600000).toISOString();

export async function notifySlack(text: string) {
  const url = process.env["SLACK_WEBHOOK_URL"];
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {}
}

export async function notifySlackTo(url: string, text: string) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {}
}

type RowWithSecret = {
  id: string;
  type: string;
  config: Record<string, unknown> | null;
  enabled: boolean;
  secret_cipher: string | null;
};

export const transformRowWithSecret = <T extends RowWithSecret>(row: T) => ({
  id: row.id,
  type: row.type,
  config: row.config,
  enabled: row.enabled,
  hasSecret: Boolean(row.secret_cipher),
});
