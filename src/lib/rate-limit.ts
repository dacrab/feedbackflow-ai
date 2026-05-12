const store = new Map<string, number[]>();

export function rateLimit(
  identifier: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): { success: boolean; remaining: number } {
  const now = Date.now();
  const key = identifier;
  const timestamps = (store.get(key) ?? []).filter((t) => t > now - windowMs);
  if (timestamps.length >= maxRequests) {
    store.set(key, timestamps);
    return { success: false, remaining: 0 };
  }
  timestamps.push(now);
  store.set(key, timestamps);
  return { success: true, remaining: maxRequests - timestamps.length };
}
