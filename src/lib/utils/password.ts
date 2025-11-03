/**
 * Password validation and scoring utilities
 */

/**
 * Calculate password strength score (0-5)
 */
export function calculatePasswordScore(password: string): number {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return checks.filter(Boolean).length;
}

/**
 * Check if password meets minimum requirements (score >= 4)
 */
export function isPasswordValid(score: number): boolean {
  return score >= 4;
}
