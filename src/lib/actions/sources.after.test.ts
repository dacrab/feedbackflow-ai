// @vitest-environment node
// The detached ingest after addSource() only runs inside next/server's after()
// callback, which the authz suite stubs out. This file invokes it so the
// swallow-and-report path is actually exercised.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env["ENCRYPTION_KEY"] = "0".repeat(64);
});

const runIngest = vi.fn();
const captureException = vi.fn();

vi.mock("@/lib/services/ingest-service", () => ({ runIngest }));
vi.mock("@sentry/nextjs", () => ({ captureException }));
vi.mock("@/lib/api", () => ({ requireAuth: async () => "me" }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => true }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({
  after: (cb: () => void) => {
    cb();
  },
}));
vi.mock("@/db/client", () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: async () => [{ id: "11111111-1111-4111-8111-111111111111" }],
      }),
    }),
  },
}));
vi.mock("@/db/schema", () => ({ feedbackItems: {}, userSources: { id: {} } }));

const { addSource } = await import("./sources");

beforeEach(() => {
  runIngest.mockReset();
  captureException.mockReset();
});

describe("addSource detached ingest", () => {
  it("reports a failed background ingest without failing the action", async () => {
    runIngest.mockRejectedValue(new Error("boom"));

    await expect(addSource("acme/repo")).resolves.toBeUndefined();
    await vi.waitFor(() => expect(captureException).toHaveBeenCalledOnce());
  });

  it("stays silent when the background ingest succeeds", async () => {
    runIngest.mockResolvedValue({});

    await addSource("acme/repo");
    await Promise.resolve();

    expect(captureException).not.toHaveBeenCalled();
  });
});
