// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

let userIds: { userId: string }[] = [];
const sendDailyDigest = vi.fn();
const captureException = vi.fn();

vi.mock("@/db/client", () => ({
  db: { selectDistinct: () => ({ from: () => ({ where: async () => userIds }) }) },
}));
vi.mock("@/lib/services/notification-service", () => ({
  sendDailyDigest: (...a: unknown[]) => sendDailyDigest(...a),
}));
vi.mock("@sentry/nextjs", () => ({
  captureException: (...a: unknown[]) => captureException(...a),
}));

const { runDigest } = await import("./digest-service");

beforeEach(() => {
  vi.clearAllMocks();
  userIds = [];
  sendDailyDigest.mockResolvedValue({ total: 1, high: 0 });
});

describe("runDigest", () => {
  it("sums the successful digests", async () => {
    userIds = [{ userId: "u1" }, { userId: "u2" }];
    sendDailyDigest.mockImplementation(async (id: string) =>
      id === "u1" ? { total: 2, high: 1 } : { total: 3, high: 0 },
    );

    const result = await runDigest();

    expect(result).toEqual({ total: 5, high: 1, failed: 0 });
    expect(sendDailyDigest).toHaveBeenCalledTimes(2);
  });

  it("counts a rejected digest and reports it", async () => {
    userIds = [{ userId: "u1" }];
    sendDailyDigest.mockRejectedValueOnce(new Error("boom"));

    const result = await runDigest();

    expect(result).toEqual({ total: 0, high: 0, failed: 1 });
    expect(captureException).toHaveBeenCalledOnce();
  });

  it("batches more users than a single batch holds", async () => {
    userIds = Array.from({ length: 25 }, (_, i) => ({ userId: `u${i}` }));

    await runDigest();

    expect(sendDailyDigest).toHaveBeenCalledTimes(25);
  });

  it("returns zeros when nobody has notifications enabled", async () => {
    await expect(runDigest()).resolves.toEqual({ total: 0, high: 0, failed: 0 });
  });
});
