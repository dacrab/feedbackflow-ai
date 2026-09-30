import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { LLM_MAX_TOPICS, MAX_RAW_CONTENT_LENGTH, MAX_SEVERITY, RATE_LIMITS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { type Analysis, AnalysisSchema, type LLMProvider } from "@/lib/types";

export type LLMOptions = { provider: LLMProvider; model: string; apiKey: string };

// "Stop, retrying cannot help". Shared by the retry budget below and the
// ingest loop, which must break out instead of retrying every item.
export const FATAL_LLM_ERROR =
  /rate.?limit|per.?day|quota|credit|unauthorized|invalid.?api.?key|abort/i;

/** The SDK's own retry budget: it backs off and honours Retry-After. */
const MAX_RETRIES = 2;

/** Raised by this app's own per-user limiter. Transient, and must not be
 *  classified as a fatal provider error. */
export class ThrottledError extends Error {
  constructor(provider: string) {
    super(`LLM rate limit exceeded for ${provider}. Try again later.`);
    this.name = "ThrottledError";
  }
}

// Interpolated, so the model is never told a range the schema would reject.
const SYSTEM_PROMPT =
  "You are a feedback classifier. Respond ONLY with a single valid JSON object, no markdown, no explanation:\n" +
  '{"sentiment":"positive|neutral|negative","topics":["tag1","tag2"],"severity_score":1,"summary":"one sentence"}\n' +
  `sentiment: overall tone. topics: 1-${LLM_MAX_TOPICS} short tags. ` +
  `severity_score: 1(trivial)-${MAX_SEVERITY}(critical). summary: ≤20 words.`;

function getModel({ provider, model, apiKey }: LLMOptions) {
  if (provider === "openai") return createOpenAI({ apiKey })(model);
  if (provider === "anthropic") return createAnthropic({ apiKey })(model);
  // OpenRouter exposes an OpenAI-compatible API
  if (provider === "openrouter") {
    return createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" })(model);
  }
  return createGoogleGenerativeAI({ apiKey })(model);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_~`#>|]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_RAW_CONTENT_LENGTH);
}

export async function analyzeFeedback({
  text,
  opts,
  userId,
  signal,
}: {
  text: string;
  opts: LLMOptions;
  userId: string;
  signal?: AbortSignal | undefined;
}): Promise<Analysis> {
  if (!(await rateLimit(`llm:${userId}:${opts.provider}`, RATE_LIMITS.llm))) {
    throw new ThrottledError(opts.provider);
  }

  // The AI SDK already retries with backoff and honours Retry-After; a wrapper
  // here would multiply both request count and cost.
  const { output } = await generateText({
    model: getModel(opts),
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: AnalysisSchema }),
    prompt: `Classify this feedback:\n${normalize(text)}`,
    maxRetries: MAX_RETRIES,
    ...(signal ? { abortSignal: signal } : {}),
  });
  return output;
}
