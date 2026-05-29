import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rate-limit";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    expect(rateLimit("test-1", { maxRequests: 3, windowMs: 1000 }).success).toBe(true);
    expect(rateLimit("test-1", { maxRequests: 3, windowMs: 1000 }).success).toBe(true);
    expect(rateLimit("test-1", { maxRequests: 3, windowMs: 1000 }).success).toBe(true);
  });

  it("blocks when limit is reached", () => {
    rateLimit("test-2", { maxRequests: 2, windowMs: 1000 });
    rateLimit("test-2", { maxRequests: 2, windowMs: 1000 });
    expect(rateLimit("test-2", { maxRequests: 2, windowMs: 1000 }).success).toBe(false);
  });

  it("resets after window expires", () => {
    rateLimit("test-3", { maxRequests: 1, windowMs: 1000 });
    expect(rateLimit("test-3", { maxRequests: 1, windowMs: 1000 }).success).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit("test-3", { maxRequests: 1, windowMs: 1000 }).success).toBe(true);
  });

  it("isolates different identifiers", () => {
    rateLimit("id-a", { maxRequests: 1, windowMs: 1000 });
    expect(rateLimit("id-a", { maxRequests: 1, windowMs: 1000 }).success).toBe(false);
    expect(rateLimit("id-b", { maxRequests: 1, windowMs: 1000 }).success).toBe(true);
  });
});
