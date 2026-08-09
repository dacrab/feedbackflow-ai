const store = new Map<string, number[]>();

export async function rateLimit(
  identifier: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): Promise<boolean> {
  const now = Date.now();
  const timestamps = (store.get(identifier) ?? []).filter((t) => t > now - windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  store.set(identifier, timestamps);
  return true;
}
