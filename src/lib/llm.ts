import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  LLM_MAX_RETRIES,
  LLM_MAX_TOPICS,
  LLM_RETRY_BASE_DELAY_MS,
  MAX_RAW_CONTENT_LENGTH,
} from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import type { LLMProvider } from "@/lib/types";
import { withRetry } from "@/lib/utils";

const AnalysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  topics: z.array(z.string()).min(1).max(LLM_MAX_TOPICS),
  severity_score: z.number().int().min(1).max(5),
  summary: z.string().min(5).max(200),
});

const SYSTEM_PROMPT =
  'You are a feedback classifier. Respond ONLY with a single valid JSON object, no markdown, no explanation:\n{"sentiment":"positive|neutral|negative","topics":["tag1","tag2"],"severity_score":1,"summary":"one sentence"}\nsentiment: overall tone. topics: 1-5 short tags. severity_score: 1(trivial)–5(critical). summary: ≤20 words.';

type LLMOptions = { provider: LLMProvider; model: string; apiKey: string };
type Analysis = z.infer<typeof AnalysisSchema>;

function getModel({ provider, model, apiKey }: LLMOptions) {
  if (provider === "openai") return createOpenAI({ apiKey })(model);
  if (provider === "anthropic") return createAnthropic({ apiKey })(model);
  // OpenRouter exposes an OpenAI-compatible API
  if (provider === "openrouter")
    return createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" })(model);
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

export async function analyzeFeedback(
  text: string,
  retries = LLM_MAX_RETRIES,
  opts?: LLMOptions,
  userId?: string,
  signal?: AbortSignal,
): Promise<Analysis> {
  if (!opts?.apiKey || !opts?.provider)
    throw new Error("LLM not configured. Set your provider and API key in Settings.");
  const normalized = normalize(text);
  const key = userId ? `llm:${userId}:${opts.provider}` : `llm:${opts.provider}`;
  const { success } = await rateLimit(key, { maxRequests: 15, windowMs: 60_000 });
  if (!success) throw new Error(`LLM rate limit exceeded for ${opts.provider}. Try again later.`);

  const model = getModel(opts);

  return withRetry(
    async () => {
      if (signal?.aborted) throw new Error("aborted");
      const { output } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        output: Output.object({ schema: AnalysisSchema }),
        prompt: `Classify this feedback:\n${normalized}`,
        ...(signal ? { abortSignal: signal } : {}),
      });
      return output;
    },
    {
      retries,
      baseDelay: LLM_RETRY_BASE_DELAY_MS,
      abortOn: /rate.?limit|per.?day|quota|abort/i,
    },
  );
}
