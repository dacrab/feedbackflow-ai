interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
}

const REST_URL = process.env["UPSTASH_REDIS_REST_URL"];
const REST_TOKEN = process.env["UPSTASH_REDIS_REST_TOKEN"];

async function upstashLimit(
  identifier: string,
  { maxRequests, windowMs }: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const clearBefore = now - windowMs;
  const key = `rl:${identifier}`;

  // Sliding window via sorted set: remove old, check size, add new, all atomic via pipeline.
  const pipeline = [
    ["ZREMRANGEBYSCORE", key, "-inf", String(clearBefore)],
    ["ZCARD", key],
    ["ZADD", key, String(now), `${now}:${Math.random()}`],
    ["PEXPIRE", key, String(windowMs)],
  ];

  const res = await fetch(`${REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
    signal: AbortSignal.timeout(2_000),
  });

  if (!res.ok) {
    // Failing open: better availability than blocking legit users on Redis outage.
    return { success: true };
  }

  const data = (await res.json()) as Array<{ result?: number }>;
  const count = data[1]?.result ?? 0;
  return { success: count < maxRequests };
}

const localStore = new Map<string, number[]>();

function localLimit(
  identifier: string,
  { maxRequests, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const timestamps = (localStore.get(identifier) ?? []).filter((t) => t > now - windowMs);
  if (timestamps.length >= maxRequests) {
    localStore.set(identifier, timestamps);
    return { success: false };
  }
  timestamps.push(now);
  localStore.set(identifier, timestamps);
  return { success: true };
}

export function rateLimit(identifier: string, opts: RateLimitOptions): RateLimitResult {
  if (!REST_URL || !REST_TOKEN) return localLimit(identifier, opts);
  // Sync API preserved for callers that don't await; returns optimistic success
  // (real enforcement happens via the await path below). Callers that want hard
  // enforcement should use rateLimitAsync.
  return localLimit(identifier, opts);
}

export async function rateLimitAsync(
  identifier: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  if (!REST_URL || !REST_TOKEN) return localLimit(identifier, opts);
  try {
    return await upstashLimit(identifier, opts);
  } catch {
    return { success: true };
  }
}
