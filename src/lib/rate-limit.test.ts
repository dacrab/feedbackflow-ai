// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn();
const deleteMock = vi.fn();
const capturedValues: unknown[] = [];

vi.mock("@/db/client", () => ({
  db: { insert: insertMock, delete: deleteMock },
}));

vi.mock("@/db/schema", () => ({
  rateLimits: {},
}));

function mockDbCount(count: number) {
  insertMock.mockReturnValue({
    values: (values: unknown) => {
      capturedValues.push(values);
      return { onConflictDoUpdate: () => ({ returning: async () => [{ count }] }) };
    },
  });
  deleteMock.mockReturnValue({ where: () => {} });
}

const { rateLimit } = await import("./rate-limit");

describe("rateLimit", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(1);
    mockDbCount(1);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    capturedValues.length = 0;
  });

  it("allows when count is under the limit", async () => {
    mockDbCount(2);
    expect(await rateLimit("k", { maxRequests: 3, windowMs: 1000 })).toBe(true);
  });

  it("allows exactly at the limit", async () => {
    mockDbCount(3);
    expect(await rateLimit("k", { maxRequests: 3, windowMs: 1000 })).toBe(true);
  });

  it("blocks when count exceeds the limit", async () => {
    mockDbCount(4);
    expect(await rateLimit("k", { maxRequests: 3, windowMs: 1000 })).toBe(false);
  });

  it("blocks all requests when maxRequests is 0", async () => {
    expect(await rateLimit("k", { maxRequests: 0, windowMs: 1000 })).toBe(false);
  });

  it("records the identifier and window start on insert", async () => {
    await rateLimit("user-1", { maxRequests: 5, windowMs: 2000 });
    expect(capturedValues[0]).toMatchObject({ key: "user-1", count: 1 });
    expect((capturedValues[0] as { windowStartedAt: Date }).windowStartedAt).toBeInstanceOf(Date);
  });

  it("deletes stale rows on occasional cleanup", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    await rateLimit("k", { maxRequests: 1, windowMs: 1000 });
    expect(deleteMock).toHaveBeenCalledOnce();
  });

  it("skips cleanup most of the time", async () => {
    await rateLimit("k", { maxRequests: 1, windowMs: 1000 });
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
