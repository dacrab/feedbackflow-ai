// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LLMProvider } from "./types";

const generateText = vi.fn();
vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateText(...args),
  Output: { object: (opts: unknown) => ({ __object: opts }) },
}));

const createOpenAI = vi.fn();
const createAnthropic = vi.fn();
const createGoogleGenerativeAI = vi.fn();
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: (...a: unknown[]) => createOpenAI(...a) }));
vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: (...a: unknown[]) => createAnthropic(...a),
}));
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: (...a: unknown[]) => createGoogleGenerativeAI(...a),
}));

const rateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));

const { analyzeFeedback, FATAL_LLM_ERROR, ThrottledError } = await import("./llm");

const ANALYSIS = { sentiment: "positive", topics: ["billing"], severity_score: 2, summary: "fine" };
const OPTS = { provider: "openai" as const, model: "gpt-5", apiKey: "sk" };

const providerFn = (name: string) => (model: string) => ({ provider: name, model });

let lastArgs: Record<string, unknown> = {};

beforeEach(() => {
  vi.clearAllMocks();
  lastArgs = {};
  rateLimit.mockResolvedValue(true);
  generateText.mockImplementation(async (args: Record<string, unknown>) => {
    lastArgs = args;
    return { output: ANALYSIS };
  });
  createOpenAI.mockImplementation(() => providerFn("openai"));
  createAnthropic.mockImplementation(() => providerFn("anthropic"));
  createGoogleGenerativeAI.mockImplementation(() => providerFn("google"));
});

describe("analyzeFeedback provider routing", () => {
  it.each(["openai", "anthropic", "google"] as const)("selects the %s model", async (provider) => {
    await analyzeFeedback({ text: "hello", opts: { ...OPTS, provider }, userId: "u1" });
    expect(lastArgs["model"]).toEqual({ provider, model: "gpt-5" });
  });

  it("routes openrouter through the OpenAI-compatible endpoint", async () => {
    createOpenAI.mockImplementation(() => providerFn("openrouter"));
    await analyzeFeedback({
      text: "hello",
      opts: { ...OPTS, provider: "openrouter" },
      userId: "u1",
    });
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: "sk",
      baseURL: "https://openrouter.ai/api/v1",
    });
    expect(lastArgs["model"]).toEqual({ provider: "openrouter", model: "gpt-5" });
  });

  it("fails loudly for a provider with no branch", async () => {
    await expect(
      analyzeFeedback({
        text: "hello",
        opts: { ...OPTS, provider: "bogus" as LLMProvider },
        userId: "u1",
      }),
    ).rejects.toThrow("Unsupported LLM provider");
  });
});

describe("analyzeFeedback request shaping", () => {
  it("passes the normalized prompt, retry budget and schema output", async () => {
    await analyzeFeedback({
      text: "```js\nconst x = 1\n``` __HELLO__ https://example.com/a  world",
      opts: OPTS,
      userId: "u1",
    });
    const prompt = lastArgs["prompt"] as string;
    expect(prompt).toContain("hello");
    expect(prompt).not.toContain("```");
    expect(prompt).not.toContain("https://");
    expect(prompt).not.toContain("__");
    expect(lastArgs["maxRetries"]).toBe(2);
    expect(lastArgs["output"]).toMatchObject({ __object: { schema: expect.anything() } });
  });

  it("forwards the abort signal when given", async () => {
    const { signal } = new AbortController();
    await analyzeFeedback({ text: "hello", opts: OPTS, userId: "u1", signal });
    expect(lastArgs["abortSignal"]).toBe(signal);
  });

  it("omits the abort signal when not given", async () => {
    await analyzeFeedback({ text: "hello", opts: OPTS, userId: "u1" });
    expect(lastArgs).not.toHaveProperty("abortSignal");
  });

  it("throws a ThrottledError when the per-user limiter denies", async () => {
    rateLimit.mockResolvedValue(false);
    await expect(
      analyzeFeedback({ text: "hello", opts: OPTS, userId: "u1" }),
    ).rejects.toBeInstanceOf(ThrottledError);
    expect(generateText).not.toHaveBeenCalled();
  });
});

describe("FATAL_LLM_ERROR", () => {
  it("matches provider-fatal failures", () => {
    for (const msg of ["429 rate limit", "per-day quota", "invalid api key"]) {
      expect(FATAL_LLM_ERROR.test(msg)).toBe(true);
    }
  });

  it("ignores transient failures", () => {
    expect(FATAL_LLM_ERROR.test("internal server error")).toBe(false);
  });
});
