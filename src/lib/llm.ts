import crypto from "node:crypto";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
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
  summary: z.string().min(5).max(200),
});

// Explicit JSON example in prompt — required for models that don't support tool-calling
const SYSTEM_PROMPT =
  'You are a feedback classifier. Respond ONLY with a single valid JSON object, no markdown, no explanation:\n{"sentiment":"positive|neutral|negative","topics":["tag1","tag2"],"severity_score":1,"summary":"one sentence"}\nsentiment: overall tone. topics: 1-5 short tags. severity_score: 1(trivial)–5(critical). summary: ≤20 words.';

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  google: "gemini-3.5-flash",
  openai: "gpt-5.4-nano",
  anthropic: "claude-haiku-4-5",
  openrouter: "openrouter/auto",
} as const;

type LLMOptions = { provider?: LLMProvider; model?: string; apiKey?: string };
type Analysis = z.infer<typeof AnalysisSchema>;

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
  if (provider === "openrouter") {
    const apiKey = opts?.apiKey ?? process.env["OPENROUTER_API_KEY"];
    if (!apiKey) throw new Error("OPENROUTER_API_KEY missing");
    return createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" })(modelName);
  }
  if (opts?.apiKey) return createGoogleGenerativeAI({ apiKey: opts.apiKey })(modelName);
  return google(modelName);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_~`#>|]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LLM_INPUT_LENGTH);
}

/** Extract JSON from a raw text response (handles markdown code fences) */
function parseTextResponse(text: string): Analysis {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no JSON object found in response");
  return AnalysisSchema.parse(JSON.parse(match[0]));
}

const analysisCache = new Map<string, { result: Analysis; ts: number }>();
const CACHE_MAX = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cacheKey(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function getCached(text: string) {
  const key = cacheKey(normalize(text));
  const entry = analysisCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts >= CACHE_TTL_MS) {
    analysisCache.delete(key);
    return null;
  }
  analysisCache.delete(key);
  analysisCache.set(key, entry);
  return entry.result;
}

export function setCache(text: string, result: Analysis) {
  const key = cacheKey(normalize(text));
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
): Promise<Analysis> {
  const normalized = normalize(text);
  const cached = getCached(text);
  if (cached) return cached;

  const provider = opts?.provider ?? "google";
  const { success } = rateLimit(`llm:${provider}`, { maxRequests: 15, windowMs: 60_000 });
  if (!success) throw new Error(`LLM rate limit exceeded for ${provider}. Try again later.`);

  const model = getModel(opts);
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Primary: structured output via generateObject (tool-calling)
      const { object } = await generateObject({
        model,
        system: SYSTEM_PROMPT,
        schema: AnalysisSchema,
        prompt: `Classify this feedback:\n${normalized}`,
      });
      setCache(text, object);
      return object;
    } catch (err) {
      lastErr = err;
      const msg = String(err);
      if (/rate.?limit|per.?day|quota/i.test(msg)) break;

      // Fallback: model doesn't support tool-calling — use plain text + manual parse
      if (/NoObjectGenerated|could not parse/i.test(msg)) {
        try {
          const { text: raw } = await generateText({
            model,
            system: SYSTEM_PROMPT,
            prompt: `Classify this feedback:\n${normalized}`,
          });
          const result = parseTextResponse(raw);
          setCache(text, result);
          return result;
        } catch (fallbackErr) {
          lastErr = fallbackErr;
        }
        break; // don't retry if the model fundamentally can't do structured output
      }

      if (attempt < retries)
        await new Promise((r) => setTimeout(r, LLM_RETRY_BASE_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastErr;
}
