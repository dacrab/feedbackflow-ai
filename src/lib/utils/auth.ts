/**
 * Shared authentication utilities
 */

/**
 * Get the redirect URL for auth callbacks
 * @param next - Optional next path after callback
 */
export function getAuthRedirectTo(next?: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const base = `${window.location.origin}/auth/callback`;
  return next ? `${base}?next=${next}` : base;
}

/**
 * Extract error message from unknown error type
 */
export function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
}

/**
 * Normalize email address
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
