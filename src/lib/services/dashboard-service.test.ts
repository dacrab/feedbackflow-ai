// @vitest-environment node
import { drizzle } from "drizzle-orm/pg-proxy";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_SEVERITY } from "@/lib/constants";

type Row = unknown[];

const captured: { sql: string; params: unknown[] }[] = [];
let summary: Row[] = [];
let severity: Row[] = [];
let trend: Row[] = [];
let topics: Row[] = [];

vi.mock("@/db/client", () => {
  const db = drizzle(async (sql: string, params: unknown[]) => {
    captured.push({ sql, params });
    if (sql.includes('group by "feedback_analyses"."sentiment"')) return { rows: summary };
    if (sql.includes('group by "feedback_analyses"."severity_score"')) return { rows: severity };
    if (sql.includes('"feedback_trend"')) return { rows: trend };
    if (sql.includes('"feedback_topics"')) return { rows: topics };
    return { rows: [] };
  });
  return { db };
});

const { getDashboard } = await import("./dashboard-service");

beforeEach(() => {
  captured.length = 0;
  summary = [];
  severity = [];
  trend = [];
  topics = [];
});

describe("getDashboard", () => {
  it("aggregates sentiment, severity and the trend", async () => {
    summary = [
      ["positive", 2, 1, "4.0"],
      ["neutral", 1, 0, "2.0"],
      ["negative", 1, 0, "2.5"],
      ["other", 1, 0, "3.0"],
    ];
    severity = [
      [1, 0],
      [2, 3],
      [5, 1],
    ];
    trend = [
      ["2024-06-01", 4, 2],
      ["2024-06-02", 6, 2],
    ];
    topics = [
      ["billing", 5],
      ["ui", 2],
    ];

    const d = await getDashboard("me");

    expect(d.total).toBe(5);
    expect(d.positive).toBe(2);
    expect(d.neutral).toBe(1);
    expect(d.negative).toBe(1);
    expect(d.highSeverity).toBe(1);
    expect(d.positiveShare).toBe(40);
    // Sum-weighted from the unrounded per-sentiment averages, then rounded once.
    expect(d.avgSeverity).toBe("3.1");
    expect(d.trendLabels).toHaveLength(2);
    expect(d.trendValues).toEqual([4, 6]);
    expect(d.trendDelta).toBe(2);
    expect(d.topTopics).toEqual([
      { topic: "billing", value: 5 },
      { topic: "ui", value: 2 },
    ]);
    expect(d.severityHist[1]).toBe(0);
    expect(d.severityHist[2]).toBe(3);
    expect(d.severityHist[5]).toBe(1);
    expect(Object.keys(d.severityHist)).toHaveLength(MAX_SEVERITY);
  });

  it("defaults the delta and share when nothing is in window", async () => {
    const d = await getDashboard("me");

    expect(d.total).toBe(0);
    expect(d.positiveShare).toBe(0);
    expect(d.avgSeverity).toBe("0.0");
    expect(d.trendLabels).toEqual([]);
    expect(d.trendDelta).toBe(0);
    expect(d.topTopics).toEqual([]);
  });

  it("scopes every statement to the caller", async () => {
    await getDashboard("user-42");
    expect(captured).toHaveLength(4);
    for (const { params } of captured) {
      expect(params).toContain("user-42");
    }
  });
});
