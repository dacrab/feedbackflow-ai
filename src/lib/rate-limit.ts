interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
}

const store = new Map<string, number[]>();

export async function rateLimit(
  identifier: string,
  { maxRequests, windowMs }: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const timestamps = (store.get(identifier) ?? []).filter((t) => t > now - windowMs);
  if (timestamps.length >= maxRequests) {
    store.set(identifier, timestamps);
    return { success: false };
  }
  timestamps.push(now);
  if (timestamps.length) store.set(identifier, timestamps);
  else store.delete(identifier);
  return { success: true };
}
