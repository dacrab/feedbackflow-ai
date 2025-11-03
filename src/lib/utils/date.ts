/**
 * Date formatting utilities
 */

/**
 * Format date to UTC locale string with consistent formatting
 */
export function formatDateUTC(iso: string): string {
  const dt = new Date(iso);
  try {
    return dt.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dt.toISOString();
  }
}

/**
 * Get ISO date string for a date N hours ago
 */
export function getDateNHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function getDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
