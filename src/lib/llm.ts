import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const AnalysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  topics: z.array(z.string()).min(1).max(10),
  severity_score: z.number().int().min(1).max(5),
  summary: z.string().min(5).max(500),
});
type Analysis = z.infer<typeof AnalysisSchema>;

const SYSTEM_PROMPT = `You analyze user feedback and return strict JSON with fields:
sentiment: one of positive|neutral|negative;
topics: array of short topic labels like Bug Report, Feature Request, Pricing, Performance, UX;
severity_score: integer 1..5 (5=critical);
summary: one concise sentence.`;

type LLMOptions = {
  provider?: "google" | "openai" | "anthropic";
  model?: string;
  apiKey?: string;
};

function getModel(opts?: LLMOptions) {
  const provider = opts?.provider ?? "google";
  const modelName = opts?.model ?? "gemini-2.5-flash";
  if (provider === "openai") {
    const apiKey = opts?.apiKey || process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("OPENAI_API_KEY missing");
    const openai = createOpenAI({ apiKey });
    return openai(modelName);
  }
  if (provider === "anthropic") {
    const apiKey = opts?.apiKey || process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
    const anthropic = createAnthropic({ apiKey });
    return anthropic(modelName);
  }
  if (opts?.apiKey) {
    const g = createGoogleGenerativeAI({ apiKey: opts.apiKey });
    return g(modelName);
  }
  // default: use env-based google provider
  return google(modelName);
}

export async function analyzeFeedback(
  text: string,
  retries = 2,
  opts?: LLMOptions,
): Promise<Analysis> {
  const model = getModel(opts);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        schema: AnalysisSchema,
        prompt: `${SYSTEM_PROMPT}\n\n${text.slice(0, 8000)}`,
      });
      return object as Analysis;
    } catch (err: unknown) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("LLM analysis failed");
}
