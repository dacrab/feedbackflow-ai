// @vitest-environment node
import { drizzle } from "drizzle-orm/pg-proxy";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Analysis } from "@/lib/types";

const captured: { sql: string; params: unknown[] }[] = [];
let hookRows: unknown[] = [];
let topRows: unknown[] = [];
let countRows: unknown[] = [];

vi.mock("@/db/client", () => {
  const db = drizzle(async (sql: string, params: unknown[]) => {
    captured.push({ sql, params });
    if (sql.includes('"user_notifications"')) return { rows: hookRows };
    if (sql.includes("count(")) return { rows: countRows };
    if (sql.includes('"feedback_analyses"')) return { rows: topRows };
    return { rows: [] };
  });
  return { db };
});

const tryDecrypt = vi.fn();
vi.mock("@/lib/crypto", () => ({ tryDecrypt: (...a: unknown[]) => tryDecrypt(...a) }));

const captureMessage = vi.fn();
const captureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureMessage: (...a: unknown[]) => captureMessage(...a),
  captureException: (...a: unknown[]) => captureException(...a),
}));

const sent: string[] = [];
const fetchMock = vi.fn((_url: string, init?: { body?: string }) => {
  sent.push((JSON.parse(init?.body ?? "{}") as { text: string }).text);
  return Promise.resolve({ ok: true, status: 200 });
});

const { notifyHighSeverityFeedback, sendDailyDigest } = await import("./notification-service");

const analysis = (severity: number, summary = "something bad"): Analysis => ({
  sentiment: "negative",
  topics: ["billing"],
  severity_score: severity,
  summary,
});

const decryptToUrl = (cipher: string | null) => (cipher ? `https://hooks/${cipher}` : undefined);

beforeEach(() => {
  vi.clearAllMocks();
  captured.length = 0;
  sent.length = 0;
  hookRows = [];
  topRows = [];
  countRows = [[0]];
  tryDecrypt.mockImplementation(decryptToUrl);
  fetchMock.mockImplementation((_url: string, init?: { body?: string }) => {
    sent.push((JSON.parse(init?.body ?? "{}") as { text: string }).text);
    return Promise.resolve({ ok: true, status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("notifyHighSeverityFeedback", () => {
  it("returns before touching the database when nothing is high severity", async () => {
    await notifyHighSeverityFeedback("me", []);
    expect(captured).toHaveLength(0);
  });

  it("stays quiet when no webhook decrypts", async () => {
    hookRows = [["a", {}]];
    tryDecrypt.mockReturnValue(undefined);

    await notifyHighSeverityFeedback("me", [analysis(5)]);

    expect(sent).toHaveLength(0);
  });

  it("only notifies webhooks whose threshold the item meets", async () => {
    hookRows = [
      ["a", { minSeverity: 2 }],
      ["b", { minSeverity: 5 }],
    ];

    await notifyHighSeverityFeedback("me", [analysis(3)]);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("High severity (3/5)");
  });

  it("falls back to the default threshold for a webhook without one", async () => {
    hookRows = [["a", {}]];

    await notifyHighSeverityFeedback("me", [analysis(3)]);

    // HIGH_SEVERITY_THRESHOLD is 4, so a 3 is under it.
    expect(sent).toHaveLength(0);
  });

  it("escapes the attacker-authored summary", async () => {
    hookRows = [["a", {}]];

    await notifyHighSeverityFeedback("me", [analysis(5, "<@here> & <b> boom")]);

    expect(sent[0]).toContain("&lt;@here&gt; &amp; &lt;b&gt; boom");
  });

  it("reports a non-ok response without throwing", async () => {
    hookRows = [["a", {}]];
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await notifyHighSeverityFeedback("me", [analysis(5)]);

    expect(captureMessage).toHaveBeenCalledWith(expect.stringContaining("500"), expect.anything());
  });

  it("swallows a transport failure", async () => {
    hookRows = [["a", {}]];
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(notifyHighSeverityFeedback("me", [analysis(5)])).resolves.toBeUndefined();
    expect(captureException).toHaveBeenCalledOnce();
  });
});

describe("sendDailyDigest", () => {
  it("returns the window total when there is nothing high severity", async () => {
    countRows = [[7]];
    hookRows = [["a", {}]];

    const r = await sendDailyDigest("me", new Date());

    expect(r).toEqual({ total: 7, high: 0 });
    expect(sent).toHaveLength(0);
  });

  it("returns zero when the count row is missing", async () => {
    countRows = [];

    const r = await sendDailyDigest("me", new Date());

    expect(r).toEqual({ total: 0, high: 0 });
  });

  it("summarises the top high-severity items and sends them", async () => {
    hookRows = [["a", {}]];
    topRows = [
      ["bad thing", 5],
      ["worse", 4],
    ];
    countRows = [[12]];

    const r = await sendDailyDigest("me", new Date());

    expect(r).toEqual({ total: 12, high: 2 });
    expect(sent[0]).toContain("Daily Digest");
    expect(sent[0]).toContain("[sev 5] bad thing");
    expect(sent[0]).toContain("[sev 4] worse");
  });

  it("truncates an oversized digest under the Slack limit", async () => {
    hookRows = [["a", {}]];
    topRows = Array.from({ length: 20 }, (_, i) => [`${i} `.padEnd(300, "x"), 5]);
    countRows = [[20]];

    await sendDailyDigest("me", new Date());

    expect(sent[0]?.endsWith("…truncated")).toBe(true);
    expect((sent[0] ?? "").length).toBeLessThan(3600);
  });
});
