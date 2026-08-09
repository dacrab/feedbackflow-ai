import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rate-limit";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows requests under the limit", async () => {
    expect(await rateLimit("test-1", { maxRequests: 3, windowMs: 1000 })).toBe(true);
    expect(await rateLimit("test-1", { maxRequests: 3, windowMs: 1000 })).toBe(true);
    expect(await rateLimit("test-1", { maxRequests: 3, windowMs: 1000 })).toBe(true);
  });

  it("blocks when limit is reached", async () => {
    await rateLimit("test-2", { maxRequests: 2, windowMs: 1000 });
    await rateLimit("test-2", { maxRequests: 2, windowMs: 1000 });
    expect(await rateLimit("test-2", { maxRequests: 2, windowMs: 1000 })).toBe(false);
  });

  it("resets after window expires", async () => {
    await rateLimit("test-3", { maxRequests: 1, windowMs: 1000 });
    expect(await rateLimit("test-3", { maxRequests: 1, windowMs: 1000 })).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(await rateLimit("test-3", { maxRequests: 1, windowMs: 1000 })).toBe(true);
  });

  it("isolates different identifiers", async () => {
    await rateLimit("id-a", { maxRequests: 1, windowMs: 1000 });
    expect(await rateLimit("id-a", { maxRequests: 1, windowMs: 1000 })).toBe(false);
    expect(await rateLimit("id-b", { maxRequests: 1, windowMs: 1000 })).toBe(true);
  });

  it("blocks all requests when maxRequests is 0", async () => {
    expect(await rateLimit("block-all", { maxRequests: 0, windowMs: 1000 })).toBe(false);
  });
});
