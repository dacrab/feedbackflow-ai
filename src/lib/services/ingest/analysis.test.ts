// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LLMOptions } from "@/lib/llm";
import { ThrottledError } from "@/lib/llm";

const insertValues = vi.fn().mockReturnValue({
  onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
});
const selectWhere = vi.fn().mockResolvedValue([]);

vi.mock("@/db/client", () => ({
  db: {
    insert: () => ({ values: insertValues }),
    select: () => ({ from: () => ({ where: () => ({ limit: selectWhere }) }) }),
  },
}));
vi.mock("@/db/schema", () => ({ feedbackAnalyses: {}, userSettings: {} }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const tryDecrypt = vi.fn();
vi.mock("@/lib/crypto", () => ({ tryDecrypt: (...a: unknown[]) => tryDecrypt(...a) }));

const analyzeFeedback = vi.fn();
vi.mock("@/lib/llm", async () => {
  const actual = await vi.importActual<typeof import("@/lib/llm")>("@/lib/llm");
  return { ...actual, analyzeFeedback: (...a: unknown[]) => analyzeFeedback(...a) };
});

const { analyzeAndStore, getUserLLMOpts } = await import("./analysis");

const OPTS: LLMOptions = { provider: "openai", model: "gpt-5.4-nano", apiKey: "sk-x" };
const ITEMS = [
  { id: "i1", rawContent: "a" },
  { id: "i2", rawContent: "b" },
  { id: "i3", rawContent: "c" },
];

describe("analyzeAndStore error classification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats our own throttle as non-fatal and keeps going", async () => {
    analyzeFeedback.mockRejectedValue(new ThrottledError("openai"));

    const result = await analyzeAndStore(ITEMS, {
      userId: "u1",
      llmOpts: OPTS,
      emit: undefined,
      signal: undefined,
    });

    expect(result.hasError).toBe(false);
    // Not a permanent failure: it clears on its own next run.
    expect(analyzeFeedback).toHaveBeenCalledTimes(3);
  });

  it("reports the throttle distinctly rather than as a provider rejection", async () => {
    analyzeFeedback.mockRejectedValue(new ThrottledError("openai"));

    const events: string[] = [];
    await analyzeAndStore(ITEMS, {
      userId: "u1",
      llmOpts: OPTS,
      emit: (_s, m) => events.push(m),
      signal: undefined,
    });

    expect(events.some((m) => m.includes("rate limit reached"))).toBe(true);
    expect(events.some((m) => m.includes("provider rejected"))).toBe(false);
  });

  it("breaks the loop on a fatal provider error", async () => {
    analyzeFeedback.mockRejectedValue(new Error("AI_APICallError: invalid API key"));

    const result = await analyzeAndStore(ITEMS, {
      userId: "u1",
      llmOpts: OPTS,
      emit: undefined,
      signal: undefined,
    });

    expect(result.hasError).toBe(true);
    expect(analyzeFeedback).toHaveBeenCalledTimes(1);
  });

  it("continues past a non-fatal per-item error", async () => {
    analyzeFeedback.mockRejectedValueOnce(new Error("network hiccup")).mockResolvedValue({
      sentiment: "positive",
      topics: ["t"],
      severity_score: 1,
      summary: "ok",
    });

    const result = await analyzeAndStore(ITEMS, {
      userId: "u1",
      llmOpts: OPTS,
      emit: undefined,
      signal: undefined,
    });

    expect(result.hasError).toBe(false);
    expect(result.count).toBe(2);
  });

  it("bails once when no LLM is configured, instead of failing every item", async () => {
    const events: string[] = [];
    const result = await analyzeAndStore(ITEMS, {
      userId: "u1",
      llmOpts: undefined,
      emit: (_s, m) => events.push(m),
      signal: undefined,
    });

    expect(result.hasError).toBe(true);
    expect(result.count).toBe(0);
    expect(events).toHaveLength(1);
  });

  it("stops before the next item once the signal is aborted", async () => {
    analyzeFeedback.mockResolvedValue({
      sentiment: "positive",
      topics: ["t"],
      severity_score: 1,
      summary: "ok",
    });
    const controller = new AbortController();

    const result = await analyzeAndStore(ITEMS, {
      userId: "u1",
      llmOpts: OPTS,
      emit: () => controller.abort(),
      signal: controller.signal,
    });

    // Aborted during the first item, so the loop breaks before the second.
    expect(analyzeFeedback).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(1);
  });

  it("collects only the high-severity analyses for notification", async () => {
    analyzeFeedback
      .mockResolvedValueOnce({
        sentiment: "negative",
        topics: ["t"],
        severity_score: 5,
        summary: "bad",
      })
      .mockResolvedValueOnce({
        sentiment: "positive",
        topics: ["t"],
        severity_score: 1,
        summary: "fine",
      })
      .mockResolvedValueOnce({
        sentiment: "negative",
        topics: ["t"],
        severity_score: 4,
        summary: "meh",
      });

    const result = await analyzeAndStore(ITEMS, {
      userId: "u1",
      llmOpts: OPTS,
      emit: undefined,
      signal: undefined,
    });

    expect(result.count).toBe(3);
    expect(result.highSeverity.map((a) => a.severity_score)).toEqual([5, 4]);
  });
});

describe("getUserLLMOpts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tryDecrypt.mockReturnValue(undefined);
  });

  it("returns undefined when the user has no settings row", async () => {
    selectWhere.mockResolvedValue([]);
    await expect(getUserLLMOpts("u1")).resolves.toBeUndefined();
  });

  it("returns the decrypted options for a fully configured user", async () => {
    selectWhere.mockResolvedValue([{ provider: "openai", model: "m", apiKeyCipher: "v1:x" }]);
    tryDecrypt.mockReturnValue("sk-live");

    await expect(getUserLLMOpts("u1")).resolves.toEqual({
      provider: "openai",
      model: "m",
      apiKey: "sk-live",
    });
  });

  it("throws a specific cause for an unknown stored provider", async () => {
    selectWhere.mockResolvedValue([{ provider: "llama", model: "m", apiKeyCipher: "v1:x" }]);
    await expect(getUserLLMOpts("u1")).rejects.toThrow(/Unknown LLM provider "llama"/);
  });

  it("throws when no model is selected", async () => {
    selectWhere.mockResolvedValue([{ provider: "openai", model: "", apiKeyCipher: "v1:x" }]);
    await expect(getUserLLMOpts("u1")).rejects.toThrow(/No model selected/);
  });

  it("throws when the stored key cannot be decrypted", async () => {
    selectWhere.mockResolvedValue([{ provider: "openai", model: "m", apiKeyCipher: "v1:x" }]);
    // tryDecrypt returns undefined for an undecryptable row.
    await expect(getUserLLMOpts("u1")).rejects.toThrow(/No API key saved/);
  });
});
