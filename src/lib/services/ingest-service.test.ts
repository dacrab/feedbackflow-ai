// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const finalizeRun = vi.fn();
const claimRun = vi.fn();
const reclaimStaleRuns = vi.fn();

vi.mock("@/lib/services/ingest/runs", () => ({
  claimRun: (...a: unknown[]) => claimRun(...a),
  finalizeRun: (...a: unknown[]) => finalizeRun(...a),
  newStats: () => ({ fetched: 0, inserted: 0, analyzed: 0, hasError: false }),
  reclaimStaleRuns: (...a: unknown[]) => reclaimStaleRuns(...a),
}));
vi.mock("@/lib/services/ingest/github", () => ({
  fetchGithubIssues: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/services/ingest/analysis", () => ({
  getUserLLMOpts: vi.fn(),
  analyzeAndStore: vi.fn().mockResolvedValue({ count: 0, hasError: false, highSeverity: [] }),
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
const updateSet = vi.fn().mockReturnValue({ where: vi.fn() });
const insertReturning = vi.fn().mockResolvedValue([]);
vi.mock("@/db/client", () => ({
  db: {
    select: () => ({ from: () => ({ where: selectWhere }) }),
    insert: () => ({
      values: () => ({ onConflictDoNothing: () => ({ returning: insertReturning }) }),
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
});
