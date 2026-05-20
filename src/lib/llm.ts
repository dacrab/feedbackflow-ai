import crypto from "node:crypto";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { LLMProvider } from "@/lib/types";
import {
  LLM_MAX_RETRIES,
  LLM_MAX_TOPICS,
  LLM_RETRY_BASE_DELAY_MS,
  MAX_LLM_INPUT_LENGTH,
} from "./constants";
import { rateLimit } from "./rate-limit";

const AnalysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  topics: z.array(z.string()).min(1).max(LLM_MAX_TOPICS),
  severity_score: z.number().int().min(1).max(5),
  summary: z.string().min(5).max(500),
});

const SYSTEM_PROMPT = `You are a feedback analysis expert. Analyze user feedback and classify it accurately.
Focus on identifying the core issue, sentiment, and business impact.`;

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  google: "gemini-2.5-flash",
  openai: "gpt-5.4-nano",
  anthropic: "claude-haiku-4-5",
} as const;

type LLMOptions = { provider?: LLMProvider; model?: string; apiKey?: string };

function getModel(opts?: LLMOptions) {
  const provider = opts?.provider ?? "google";
  const modelName = opts?.model ?? DEFAULT_MODELS[provider];
  if (provider === "openai") {
    const apiKey = opts?.apiKey ?? process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("OPENAI_API_KEY missing");
    return createOpenAI({ apiKey })(modelName);
  }
  if (provider === "anthropic") {
    const apiKey = opts?.apiKey ?? process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
    return createAnthropic({ apiKey })(modelName);
  }
  if (opts?.apiKey) return createGoogleGenerativeAI({ apiKey: opts.apiKey })(modelName);
  return google(modelName);
}

// In-memory LRU cache for analysis results (keyed by content hash)
const analysisCache = new Map<string, { result: z.infer<typeof AnalysisSchema>; ts: number }>();
const CACHE_MAX = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getCached(text: string) {
  const key = crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
  const entry = analysisCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.result;
  if (entry) analysisCache.delete(key);
  return null;
}

function setCache(text: string, result: z.infer<typeof AnalysisSchema>) {
  const key = crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
  if (analysisCache.size >= CACHE_MAX) {
    const oldest = analysisCache.keys().next().value;
    if (oldest) analysisCache.delete(oldest);
  }
  analysisCache.set(key, { result, ts: Date.now() });
}

export async function analyzeFeedback(
  text: string,
  retries = LLM_MAX_RETRIES,
  opts?: LLMOptions,
): Promise<z.infer<typeof AnalysisSchema>> {
  const trimmed = text.slice(0, MAX_LLM_INPUT_LENGTH);
  const cached = getCached(trimmed);
  if (cached) return cached;

  const provider = opts?.provider ?? "google";
  const { success } = rateLimit(`llm:${provider}`, { maxRequests: 15, windowMs: 60_000 });
  if (!success) throw new Error(`LLM rate limit exceeded for ${provider}. Try again later.`);

  const model = getModel(opts);
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        system: SYSTEM_PROMPT,
        schema: AnalysisSchema,
        prompt: `Analyze this feedback:\n\n${trimmed}`,
      });
      setCache(trimmed, object);
      return object;
    } catch (err) {
      lastErr = err;
      if (attempt < retries)
        await new Promise((r) => setTimeout(r, LLM_RETRY_BASE_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastErr;
}
