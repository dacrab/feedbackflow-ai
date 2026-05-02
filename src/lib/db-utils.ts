import type { FeedbackStatus } from "./types";

export function parseTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string");
}

export function parseStatus(raw: unknown): FeedbackStatus {
  if (raw === "New" || raw === "Acknowledged" || raw === "Actioned") {
    return raw;
  }
  return "New";
}
