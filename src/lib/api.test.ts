// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));

const rows = vi.fn();
vi.mock("@/db/client", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ limit: rows }) }) }) },
}));

const rateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));

const {
  getServerSession,
  jsonError,
  rateLimitResponse,
  requireAuth,
  requireCron,
  UnauthorizedError,
} = await import("./api");

const BYTES_32 = "a".repeat(64);
process.env["CRON_SECRET"] = BYTES_32;

beforeEach(() => {
  vi.clearAllMocks();
  rateLimit.mockResolvedValue(true);
});

describe("requireCron", () => {
  it("accepts the Vercel bearer token", () => {
    const req = new Request("https://x/api/cron", {
      headers: { authorization: `Bearer ${BYTES_32}` },
    });
    expect(requireCron(req)).toBeUndefined();
  });

  it("rejects a wrong bearer token", () => {
    const req = new Request("https://x/api/cron", {
      headers: { authorization: `Bearer ${"b".repeat(64)}` },
    });
    expect(requireCron(req)?.status).toBe(401);
  });

  it("rejects a missing token", () => {
    expect(requireCron(new Request("https://x/api/cron"))?.status).toBe(401);
  });

  it("fails closed when no secret is configured at all", () => {
    delete process.env["CRON_SECRET"];
    expect(requireCron(new Request("https://x/api/cron"))?.status).toBe(401);
    process.env["CRON_SECRET"] = BYTES_32;
  });
});

describe("getServerSession", () => {
  it("returns null when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect(await getServerSession()).toBeNull();
  });

  it("throws a provisioning error when the user row has not landed", async () => {
    authMock.mockResolvedValue({ userId: "u1" });
    rows.mockResolvedValue([]);
    await expect(getServerSession()).rejects.toThrow(/being provisioned/);
  });

  it("returns the user when the row exists", async () => {
    authMock.mockResolvedValue({ userId: "u1" });
    rows.mockResolvedValue([{ email: "a@b.c", name: "A" }]);
    expect(await getServerSession()).toEqual({
      user: { id: "u1", email: "a@b.c", name: "A" },
    });
  });
});

describe("requireAuth", () => {
  it("throws UnauthorizedError when there is no session", async () => {
    authMock.mockResolvedValue({ userId: null });
    await expect(requireAuth()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("propagates a provisioning failure as-is, not as an auth failure", async () => {
    authMock.mockResolvedValue({ userId: "u1" });
    rows.mockResolvedValue([]);
    await expect(requireAuth()).rejects.toThrow(/being provisioned/);
  });

  it("returns the id when signed in", async () => {
    authMock.mockResolvedValue({ userId: "u1" });
    rows.mockResolvedValue([{ email: "a@b.c", name: "A" }]);
    await expect(requireAuth()).resolves.toBe("u1");
  });
});

describe("rateLimitResponse", () => {
  it("returns undefined when under the limit", async () => {
    await expect(
      rateLimitResponse("k", { maxRequests: 5, windowMs: 60_000 }),
    ).resolves.toBeUndefined();
  });

  it("429s with a whole-second Retry-After", async () => {
    rateLimit.mockResolvedValue(false);
    const res = await rateLimitResponse("k", { maxRequests: 5, windowMs: 60_000 });
    expect(res?.status).toBe(429);
    expect(res?.headers.get("retry-after")).toBe("60");
  });

  it("never emits a fractional Retry-After for a sub-second window", async () => {
    rateLimit.mockResolvedValue(false);
    const res = await rateLimitResponse("k", { maxRequests: 5, windowMs: 500 });
    expect(res?.headers.get("retry-after")).toBe("1");
  });
});

describe("jsonError", () => {
  it("is always JSON, unlike a bare Response", async () => {
    const res = jsonError("nope", 400);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "nope" });
  });
});
