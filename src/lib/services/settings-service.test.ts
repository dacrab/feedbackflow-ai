// @vitest-environment node
import { drizzle } from "drizzle-orm/pg-proxy";
import { beforeEach, describe, expect, it, vi } from "vitest";

const captured: { sql: string; params: unknown[] }[] = [];
let settingsRows: unknown[] = [];
let sourceRows: unknown[] = [];
let hookRows: unknown[] = [];
let runRows: unknown[] = [];

vi.mock("@/db/client", () => {
  const db = drizzle(async (sql: string, params: unknown[]) => {
    captured.push({ sql, params });
    if (sql.includes('"user_settings"')) return { rows: settingsRows };
    if (sql.includes('"user_sources"')) return { rows: sourceRows };
    if (sql.includes('"user_notifications"')) return { rows: hookRows };
    if (sql.includes('"ingest_runs"')) return { rows: runRows };
    return { rows: [] };
  });
  return { db };
});

const { getSettingsData } = await import("./settings-service");

beforeEach(() => {
  captured.length = 0;
  settingsRows = [];
  sourceRows = [];
  hookRows = [];
  runRows = [];
});

describe("getSettingsData", () => {
  it("maps the provider, sources, hooks and last run", async () => {
    settingsRows = [["openai", "gpt-5", "v1:cipher"]];
    sourceRows = [["s1", "github", { repo: "a/b" }, true, null, "2024-01-01T00:00:00.000Z"]];
    hookRows = [["h1", "slack", { minSeverity: 3 }, true]];
    runRows = [["2024-06-01T00:00:00.000Z", "2024-06-01T00:00:10.000Z", true, null, 10, 4, 4]];

    const d = await getSettingsData("me");

    expect(d.settings).toEqual({ provider: "openai", model: "gpt-5", hasKey: true });
    expect(d.sources).toEqual([
      {
        id: "s1",
        type: "github",
        config: { repo: "a/b" },
        enabled: true,
        lastChecked: null,
        createdAt: expect.any(Date),
      },
    ]);
    expect(d.hooks).toEqual([
      { id: "h1", type: "slack", config: { minSeverity: 3 }, enabled: true },
    ]);
    expect(d.lastRun).toEqual({
      startedAt: expect.any(Date),
      finishedAt: expect.any(Date),
      ok: true,
      error: null,
      fetched: 10,
      inserted: 4,
      analyzed: 4,
    });
  });

  it("nulls an unrecognised provider instead of trusting the column", async () => {
    settingsRows = [["bogus", "m", "v1:cipher"]];

    const d = await getSettingsData("me");

    expect(d.settings).toEqual({ provider: null, model: "m", hasKey: true });
  });

  it("reports no key when the cipher column is empty", async () => {
    settingsRows = [["openai", "m", null]];

    const d = await getSettingsData("me");

    expect(d.settings).toMatchObject({ hasKey: false });
  });

  it("returns nulls when there is no settings row or run", async () => {
    const d = await getSettingsData("me");

    expect(d.settings).toBeNull();
    expect(d.lastRun).toBeNull();
    expect(d.sources).toEqual([]);
    expect(d.hooks).toEqual([]);
  });

  it("scopes every statement to the caller", async () => {
    await getSettingsData("user-7");

    expect(captured).toHaveLength(4);
    for (const { params } of captured) {
      expect(params).toContain("user-7");
    }
  });
});
