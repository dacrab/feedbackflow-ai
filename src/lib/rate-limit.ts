const store = new Map<string, number[]>();

// Periodically purge fully-expired keys so the map doesn't grow unbounded
setInterval(
  () => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      // We don't know the windowMs here, so keep any entry touched in the last hour
      if (timestamps.every((t) => t < now - 3_600_000)) store.delete(key);
    }
  },
  5 * 60_000, // every 5 minutes
);

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
