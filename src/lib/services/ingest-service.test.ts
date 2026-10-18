// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const finalizeRun = vi.fn();
const claimRun = vi.fn();
const reclaimStaleRuns = vi.fn();
const fetchGithubIssues = vi.fn();
const analyzeAndStore = vi.fn();

vi.mock("@/lib/services/ingest/runs", () => ({
  claimRun: (...a: unknown[]) => claimRun(...a),
  finalizeRun: (...a: unknown[]) => finalizeRun(...a),
  newStats: () => ({ fetched: 0, inserted: 0, analyzed: 0, hasError: false, error: null }),
  reclaimStaleRuns: (...a: unknown[]) => reclaimStaleRuns(...a),
}));
vi.mock("@/lib/services/ingest/github", () => ({
  fetchGithubIssues: (...a: unknown[]) => fetchGithubIssues(...a),
}));
vi.mock("@/lib/services/ingest/analysis", () => ({
  getUserLLMOpts: vi.fn(),
  analyzeAndStore: (...a: unknown[]) => analyzeAndStore(...a),
}));
vi.mock("@/lib/services/notification-service", () => ({ notifyHighSeverityFeedback: vi.fn() }));
vi.mock("@/lib/crypto", () => ({ tryDecrypt: () => undefined }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

// Two enabled sources belonging to two different tenants.
const SOURCES = [
  { id: "s1", userId: "u1", type: "github", config: { repo: "a/one" }, secretCipher: null },
  { id: "s2", userId: "u2", type: "github", config: { repo: "b/two" }, secretCipher: null },
];

const selectWhere = vi.fn();
const leftJoinWhere = vi.fn().mockResolvedValue([]);
const updateSet = vi.fn().mockReturnValue({ where: vi.fn() });
let insertedBatches: unknown[][] = [];
const insertReturning = vi.fn(async () => insertedBatches.at(-1)?.map((_, i) => ({ id: `i${i}` })));
vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: selectWhere,
        leftJoin: () => ({ where: leftJoinWhere }),
      }),
    }),
    insert: () => ({
      values: (rows: unknown[]) => {
        insertedBatches.push(rows);
        return { onConflictDoNothing: () => ({ returning: insertReturning }) };
      },
    }),
    update: () => ({ set: updateSet }),
  },
}));
vi.mock("@/db/schema", () => ({
  feedbackAnalyses: {},
  feedbackItems: {},
  userSources: { enabled: "enabled", userId: "user_id", id: "id", lastChecked: "last_checked" },
}));

const { runIngest } = await import("./ingest-service");

import type { LLMOptions } from "@/lib/llm";

const { getUserLLMOpts } = await import("@/lib/services/ingest/analysis");

const LLM_OPTS: LLMOptions = { provider: "openai", model: "gpt-5.4-nano", apiKey: "sk-x" };

function stubTwoTenants() {
  selectWhere.mockResolvedValue(SOURCES);
  claimRun.mockImplementation(async (userId: string) => `run-${userId}`);
  fetchGithubIssues.mockResolvedValue([]);
  analyzeAndStore.mockResolvedValue({ count: 0, hasError: false, highSeverity: [] });
}

describe("runIngest tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubTwoTenants();
  });

  it("keeps going when one tenant throws, and marks the run not ok", async () => {
    vi.mocked(getUserLLMOpts).mockImplementation(async (userId: string) => {
      if (userId === "u1") throw new Error('Unknown LLM provider "broken"');
      return LLM_OPTS;
    });

    const result = await runIngest();

    expect(result.ok).toBe(false);
    // u2 still got its run row finalized: it was not skipped.
    expect(finalizeRun).toHaveBeenCalledTimes(2);
    expect(claimRun).toHaveBeenCalledWith("u2");
  });

  it("resolves rather than rejecting when every tenant throws", async () => {
    vi.mocked(getUserLLMOpts).mockRejectedValue(new Error("no key"));

    // A rejection here would abort the cron for every tenant behind this one.
    await expect(runIngest()).resolves.toMatchObject({ ok: false, users: 2 });
  });

  it("reports not ok when a tenant is skipped because its slot is held", async () => {
    claimRun.mockImplementation(async (userId: string) => (userId === "u1" ? null : "run-u2"));

    const result = await runIngest();

    expect(result.ok).toBe(false);
    expect(finalizeRun).toHaveBeenCalledTimes(1);
  });

  it("reports ok for a clean run", async () => {
    vi.mocked(getUserLLMOpts).mockResolvedValue(LLM_OPTS);
    await expect(runIngest()).resolves.toMatchObject({ ok: true, users: 2 });
  });

  it("reports not ok when the caller aborts before any tenant ran", async () => {
    vi.mocked(getUserLLMOpts).mockResolvedValue(LLM_OPTS);

    const result = await runIngest({ signal: AbortSignal.abort() });

    expect(result.ok).toBe(false);
    // No slot was claimed, so there is no row to close.
    expect(claimRun).not.toHaveBeenCalled();
  });

  it("stringifies a non-Error throw from a tenant", async () => {
    vi.mocked(getUserLLMOpts).mockRejectedValue("plain string failure");

    const result = await runIngest();

    expect(result.ok).toBe(false);
    expect(finalizeRun).toHaveBeenCalledTimes(2);
  });
});

describe("runIngest source filtering and storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedBatches = [];
    stubTwoTenants();
    leftJoinWhere.mockResolvedValue([]);
    vi.mocked(getUserLLMOpts).mockResolvedValue(LLM_OPTS);
  });

  it("stores fetched issues with repo-scoped external ids", async () => {
    fetchGithubIssues.mockResolvedValue([
      { id: 7, title: "broken", body: "details", created_at: "2024-01-01T00:00:00Z" },
      { id: 8, title: "no body", body: null, created_at: "2024-01-02T00:00:00Z" },
    ]);

    await runIngest();

    // First source's batch is the first insert.
    const [firstBatch] = insertedBatches as [{ externalId: string; rawContent: string }[]];
    expect(firstBatch[0]?.externalId).toBe("a/one#7");
    expect(firstBatch[0]?.rawContent).toContain("broken");
    expect(firstBatch[1]?.rawContent).toBe("no body\n\n");
  });

  it("skips the unanalyzed query when nothing was fetched", async () => {
    fetchGithubIssues.mockResolvedValue([]);

    await runIngest();

    // No external ids means no second round-trip.
    expect(leftJoinWhere).not.toHaveBeenCalled();
  });

  it("caps analysis at maxItems for a detached ingest", async () => {
    fetchGithubIssues.mockResolvedValue([
      { id: 1, title: "a", body: null, created_at: "2024-01-01T00:00:00Z" },
      { id: 2, title: "b", body: null, created_at: "2024-01-02T00:00:00Z" },
    ]);
    leftJoinWhere.mockResolvedValue([
      { id: "i1", rawContent: "a" },
      { id: "i2", rawContent: "b" },
    ]);

    await runIngest({ maxItems: 1 });

    const [pending] = analyzeAndStore.mock.calls[0] as [{ id: string }[]];
    expect(pending).toHaveLength(1);
  });

  it("stops the source loop once the signal is aborted mid-run", async () => {
    // Two sources for one tenant; abort during the first source's fetch so the
    // loop breaks before the second source is touched.
    selectWhere.mockResolvedValue([
      { id: "s1", userId: "u1", type: "github", config: { repo: "a/one" }, secretCipher: null },
      { id: "s2", userId: "u1", type: "github", config: { repo: "a/two" }, secretCipher: null },
    ]);
    const controller = new AbortController();
    fetchGithubIssues.mockImplementation(async () => {
      controller.abort();
      return [];
    });

    await runIngest({ signal: controller.signal });

    expect(fetchGithubIssues).toHaveBeenCalledTimes(1);
  });
});
