// @vitest-environment node
// The key is cached on first use, so the missing-key path needs its own module
// instance with no ENCRYPTION_KEY set.
import { describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

delete process.env["ENCRYPTION_KEY"];

const { encrypt } = await import("./crypto");

describe("missing encryption key", () => {
  it("fails loudly rather than encrypting with an empty key", () => {
    expect(() => encrypt("secret")).toThrow("ENCRYPTION_KEY is required");
  });
});
