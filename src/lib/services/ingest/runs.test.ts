// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const updateWhere = vi.fn();
const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
const update = vi.fn().mockReturnValue({ set: updateSet });

vi.mock("@/db/client", () => ({ db: { insert, update } }));
vi.mock("@/db/schema", () => ({
  ingestRuns: { id: "id", userId: "user_id", finishedAt: "finished_at", startedAt: "started_at" },
}));

const { claimRun, finalizeRun, newStats, reclaimStaleRuns } = await import("./runs");

/** db.insert(..).values(..).onConflictDoNothing(..).returning(..) */
function stubInsert(rows: { id: string }[]) {
  const onConflictDoNothing = vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue(rows),
  });
  insert.mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing }) });
  return onConflictDoNothing;
}

describe("SyncStats", () => {
  it("starts at zero with no error", () => {
    expect(newStats()).toEqual({
      fetched: 0,
      inserted: 0,
      analyzed: 0,
      hasError: false,
      error: null,
    });
  });
});

describe("claimRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the new run id when the slot is free", async () => {
    const onConflictDoNothing = stubInsert([{ id: "run-1" }]);
    await expect(claimRun("u1")).resolves.toBe("run-1");
    expect(onConflictDoNothing).toHaveBeenCalledOnce();
  });

  it("returns null when another sync already holds the slot", async () => {
    stubInsert([]);
    await expect(claimRun("u1")).resolves.toBeNull();
  });
});

describe("reclaimStaleRuns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes out unfinished runs", async () => {
    await reclaimStaleRuns("u1");
    const patch = updateSet.mock.calls[0]?.[0] as { ok: boolean; finishedAt: Date };
    expect(patch.ok).toBe(false);
    expect(patch.finishedAt).toBeInstanceOf(Date);
  });
});

describe("finalizeRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks a clean run ok", async () => {
    await finalizeRun(
      "run-1",
      { fetched: 5, inserted: 2, analyzed: 3, hasError: false, error: null },
      false,
    );
    expect(updateSet.mock.calls[0]?.[0]).toMatchObject({
      ok: true,
      fetched: 5,
      inserted: 2,
      analyzed: 3,
    });
  });

  it("marks a provider-error run failed", async () => {
    await finalizeRun(
      "run-1",
      { fetched: 5, inserted: 2, analyzed: 0, hasError: true, error: null },
      false,
    );
    expect(updateSet.mock.calls[0]?.[0]).toMatchObject({ ok: false });
  });

  it("marks a cancelled run failed, since it stopped early", async () => {
    await finalizeRun(
      "run-1",
      { fetched: 5, inserted: 2, analyzed: 1, hasError: false, error: null },
      true,
    );
    expect(updateSet.mock.calls[0]?.[0]).toMatchObject({ ok: false, error: "cancelled" });
  });

  it("records why the run failed", async () => {
    await finalizeRun(
      "run-1",
      { fetched: 0, inserted: 0, analyzed: 0, hasError: true, error: "GitHub fetch failed: 404" },
      false,
    );
    expect(updateSet.mock.calls[0]?.[0]).toMatchObject({
      ok: false,
      error: "GitHub fetch failed: 404",
    });
  });
});
