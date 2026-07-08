// NOTE: In-memory rate limiter — NOT suitable for serverless/multi-instance deployments.
// For production, replace with a DB-backed limiter (Redis, Drizzle, Upstash, etc.).

const store = new Map<string, number[]>();

export function rateLimit(
  identifier: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): { success: boolean } {
  const now = Date.now();
  const timestamps = (store.get(identifier) ?? []).filter((t) => t > now - windowMs);

  if (timestamps.length >= maxRequests) {
    store.set(identifier, timestamps);
    return { success: false };
  }

  timestamps.push(now);
  store.set(identifier, timestamps);

  if (timestamps.length === 1) {
    scheduleCleanup(identifier, windowMs);
  }

  return { success: true };
}

const cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleCleanup(identifier: string, windowMs: number): void {
  const existing = cleanupTimers.get(identifier);
  if (existing) clearTimeout(existing);

  cleanupTimers.set(
    identifier,
    setTimeout(() => {
      store.delete(identifier);
      cleanupTimers.delete(identifier);
    }, windowMs),
  );
}
