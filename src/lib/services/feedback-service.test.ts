// @vitest-environment node
import { drizzle } from "drizzle-orm/pg-proxy";
import { beforeEach, describe, expect, it, vi } from "vitest";

const captured: { sql: string; params: unknown[] }[] = [];
let pageRows: unknown[] = [];
let countRows: unknown[] = [];
let detailRows: unknown[] = [];

vi.mock("@/db/client", () => {
  const db = drizzle(async (sql: string, params: unknown[]) => {
    captured.push({ sql, params });
    // Both the page and its total select from the `page` CTE.
    if (sql.includes('from "page"')) {
      return sql.includes("count(") ? { rows: countRows } : { rows: pageRows };
    }
    return { rows: detailRows };
  });
  return { db };
});

const { getFeedbackItems, getFeedbackItem } = await import("./feedback-service");

beforeEach(() => {
  captured.length = 0;
  pageRows = [];
  countRows = [[0]];
  detailRows = [];
});

describe("getFeedbackItems", () => {
  it("maps list rows and the filtered total", async () => {
    pageRows = [
      [
        "f1",
        "github",
        "preview",
        "2024-06-01T00:00:00.000Z",
        "positive",
        ["billing"],
        3,
        "sum",
        "New",
      ],
      ["f2", "github", "unanalysed", "2024-06-02T00:00:00.000Z", null, null, null, null, null],
    ];
    countRows = [[2]];

    const { items, total } = await getFeedbackItems("me", { limit: 10, offset: 0 });

    expect(total).toBe(2);
    expect(items[0]).toEqual({
      id: "f1",
      source: "github",
      raw_content: "preview",
      created_at: "2024-06-01T00:00:00.000Z",
      feedback_analyses: {
        sentiment: "positive",
        topics: ["billing"],
        severity_score: 3,
        summary: "sum",
        status: "New",
      },
    });
    // A left join with no analysis row must not fabricate one.
    expect(items[1]?.feedback_analyses).toBeNull();
  });

  it("defaults the total to zero when the count row is absent", async () => {
    countRows = [];
    const { total } = await getFeedbackItems("me", { limit: 5, offset: 0 });
    expect(total).toBe(0);
  });

  it("applies every filter, escaping the search term", async () => {
    await getFeedbackItems("me", {
      limit: 5,
      offset: 0,
      filters: {
        sentiment: "negative",
        status: "New",
        topic: "billing",
        q: "50%_off",
        sort: "severity_asc",
      },
    });

    const sql = captured.map((c) => c.sql).join("\n");
    const params = captured.flatMap((c) => c.params);
    expect(params).toContain("me");
    expect(params).toContain("negative");
    expect(params).toContain("New");
    expect(params).toContain('["billing"]');
    // escapeLike neutralises LIKE wildcards before they reach the pattern.
    expect(params).toContain("%50\\%\\_off%");
    expect(sql).toMatch(/like/i);
    expect(sql).toContain("@>");
    expect(sql).toContain("severity_score");
    expect(sql).toMatch(/order by .*asc/i);
  });

  it("orders by severity descending when asked", async () => {
    await getFeedbackItems("me", { limit: 5, offset: 0, filters: { sort: "severity_desc" } });
    const sql = captured.map((c) => c.sql).join("\n");
    expect(sql).toMatch(/order by .*severity_score.*desc/i);
  });
});

describe("getFeedbackItem", () => {
  it("maps a detail row", async () => {
    detailRows = [
      ["f9", "github", "body", "2024-06-01T00:00:00.000Z", "positive", [], 1, "s", "New"],
    ];

    const item = await getFeedbackItem("me", "f9");

    expect(item?.id).toBe("f9");
    expect(item?.feedback_analyses?.severity_score).toBe(1);
  });

  it("returns null when the item does not exist", async () => {
    detailRows = [];
    await expect(getFeedbackItem("me", "missing")).resolves.toBeNull();
  });
});
