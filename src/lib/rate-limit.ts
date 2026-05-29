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
  return { success: true };
}
