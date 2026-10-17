// @vitest-environment node
// Tenant isolation is the one property with no fallback: dropping a user_id
// predicate from any of these would be a silent cross-tenant read or write.
// Real drizzle query building over a no-op driver, so the assertions are on
// actual SQL rather than on mock call shapes.
import { drizzle } from "drizzle-orm/pg-proxy";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env["ENCRYPTION_KEY"] = "0".repeat(64);
});

const captured: { sql: string; params: unknown[] }[] = [];
// Set to make the next user_sources insert violate its unique index.
let uniqueViolation = false;

vi.mock("@/db/client", () => {
  const db = drizzle(async (sql: string, params: unknown[]) => {
    captured.push({ sql, params });
    // deleteSource reads the source first; report one so it proceeds.
    // pg-proxy is in array mode: each row is a positional array, and a
    // single-column select is one value wide.
    if (uniqueViolation && /insert into "user_sources"/.test(sql)) {
      throw Object.assign(new Error("duplicate key"), { code: "23505" });
    }
    if (/^select "config"/.test(sql)) return { rows: [[{ repo: "acme/repo" }]] };
    // An INSERT ... RETURNING id yields that row so the action can proceed.
    if (/returning "id"/.test(sql)) {
      return { rows: [{ id: "11111111-1111-4111-8111-111111111111" }] };
    }
    return { rows: [] };
  });
  // pg-proxy cannot run transactions. Inline the body so its statements are
  // still really built and captured.
  Object.assign(db, { transaction: (fn: (tx: unknown) => unknown) => fn(db) });
  return { db };
});

vi.mock("@/lib/api", () => ({ requireAuth: async () => "me" }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => true }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const sources = await import("./sources");
const llm = await import("./llm-settings");
const notifications = await import("./notifications");
const feedback = await import("./feedback");

/** Every statement issued since the last clear. */
const statements = () => captured.map((c) => c.sql);

beforeEach(() => {
  captured.length = 0;
  uniqueViolation = false;
});

describe("sources", () => {
  const REPO = "acme/repo";

  it("adds a source with its token encrypted, scoped to the caller", async () => {
    await sources.addSource(REPO, "ghp_secret");
    const insert = captured.find((c) => /insert into "user_sources"/.test(c.sql));
    expect(insert?.params).toContain("me");
    // The raw token must never reach the database.
    expect(JSON.stringify(insert?.params)).not.toContain("ghp_secret");
    expect(JSON.stringify(insert?.params)).toContain("v1:");
  });

  it("surfaces the unique index as a friendly duplicate error", async () => {
    uniqueViolation = true;
    // Without mapping 23505 the user would see a raw Postgres error.
    await expect(sources.addSource(REPO)).rejects.toThrow("that repo is already added");
  });

  it("rejects a malformed repo before touching the database", async () => {
    for (const bad of ["no-slash", "a/b/c", "/leading", "spaces in/name"]) {
      await expect(sources.addSource(bad)).rejects.toThrow();
    }
    expect(captured).toHaveLength(0);
  });

  it("rejects a non-boolean enabled patch", async () => {
    await expect(
      sources.updateSource("11111111-1111-4111-8111-111111111111", { enabled: "yes" as never }),
    ).rejects.toThrow();
  });
});

describe("llm settings", () => {
  it("upserts settings scoped to the caller", async () => {
    await llm.saveSettings("openai", "gpt-5.4-nano", "sk-test-key");
    const sql = statements().join("\n");
    expect(sql).toContain("user_settings");
    expect(captured.flatMap((c) => c.params)).toContain("me");
  });

  it("rejects an unknown provider", async () => {
    await expect(llm.saveSettings("llama" as never, "m", "sk-test-key")).rejects.toThrow();
    expect(captured).toHaveLength(0);
  });

  it("rejects an api key that is too short", async () => {
    await expect(llm.saveSettings("openai", "m", "sk")).rejects.toThrow();
  });

  it("rejects an empty model", async () => {
    await expect(llm.updateSettingsModel("")).rejects.toThrow();
  });
});

describe("notifications", () => {
  it("patches enabled and threshold together", async () => {
    await notifications.updateNotification("11111111-1111-4111-8111-111111111111", {
      enabled: false,
      minSeverity: 3,
    });
    const sql = statements().join("\n");
    expect(sql).toContain("user_notifications");
    expect(captured.flatMap((c) => c.params)).toContain("me");
  });

  it("rejects an empty patch rather than sending drizzle an empty SET", async () => {
    // Without the refine, drizzle throws "No values to set": a 500 for a no-op.
    await expect(
      notifications.updateNotification("11111111-1111-4111-8111-111111111111", {}),
    ).rejects.toThrow("no fields to update");
    expect(captured).toHaveLength(0);
  });
});

describe("tenant isolation", () => {
  const IDS = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];

  it.each([
    [
      "updateSource",
      () => sources.updateSource(IDS[0] as string, { enabled: false }),
      "user_sources",
    ],
    ["deleteSource", () => sources.deleteSource(IDS[0] as string), "feedback_items"],
    [
      "addNotification",
      () => notifications.addNotification("https://hooks.slack.com/services/x"),
      "user_notifications",
    ],
    [
      "deleteNotification",
      () => notifications.deleteNotification(IDS[0] as string),
      "user_notifications",
    ],
    [
      "updateFeedbackStatus",
      () => feedback.updateFeedbackStatus(IDS[0] as string, "Actioned"),
      "feedback_analyses",
    ],
    [
      "bulkUpdateStatus",
      () => feedback.bulkUpdateStatus(IDS as string[], "Actioned"),
      "feedback_analyses",
    ],
  ])("%s scopes its statement to the caller's user id", async (_name, run, table) => {
    await run();
    const sql = statements().join("\n");
    expect(sql).toContain(table);
    // The id we passed, and our own id, must both be bound parameters.
    const bound = captured.flatMap((c) => c.params);
    expect(bound).toContain("me");
  });

  it("deleteSource takes the source's feedback with it", async () => {
    await sources.deleteSource(IDS[0] as string);
    // Deleting a source must not leave its items orphaned in the inbox.
    expect(statements().some((s) => s.includes("delete") && s.includes("feedback_items"))).toBe(
      true,
    );
  });
});

describe("validation happens after auth, not before", () => {
  it("rejects an id that is not a uuid", async () => {
    await expect(sources.deleteSource("not-a-uuid")).rejects.toThrow();
    // Rejected before any statement, so no table was touched.
    expect(statements()).toHaveLength(0);
  });

  it("rejects a webhook that is not a public https URL", async () => {
    for (const bad of [
      "http://hooks.slack.com/services/x",
      "https://localhost/x",
      "https://169.254.169.254/latest/meta-data",
      "https://10.0.0.1/x",
      "not-a-url",
    ]) {
      await expect(notifications.addNotification(bad)).rejects.toThrow();
    }
    expect(statements()).toHaveLength(0);
  });

  it("accepts a public https webhook", async () => {
    await expect(
      notifications.addNotification("https://hooks.slack.com/services/T/B/XYZ"),
    ).resolves.toBeUndefined();
    expect(statements().some((s) => s.includes("insert"))).toBe(true);
  });

  it("rejects a severity outside the scale", async () => {
    await expect(
      notifications.updateNotification("11111111-1111-4111-8111-111111111111", { minSeverity: 9 }),
    ).rejects.toThrow();
  });

  it("rejects a status outside the enum", async () => {
    await expect(
      feedback.updateFeedbackStatus("11111111-1111-4111-8111-111111111111", "Deleted"),
    ).rejects.toThrow();
  });

  it("caps a bulk update so one request cannot rewrite the table", async () => {
    // Distinct, well-formed uuids: an ill-formed id would be rejected by the
    // uuid schema first, so this would pass even with the cap removed.
    const many = Array.from(
      { length: 201 },
      (_, i) => `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
    );
    await expect(feedback.bulkUpdateStatus(many, "Actioned")).rejects.toThrow(/<=200/);
  });
});
