import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, type LanguageModel, NoObjectGeneratedError } from "ai";
import { z } from "zod";

const AnalysisSchema = z.object({
  sentiment: z
    .enum(["positive", "neutral", "negative"])
    .describe("Overall sentiment of the feedback"),
  topics: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe("Topic labels like Bug Report, Feature Request, Pricing, Performance, UX"),
  severity_score: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("Priority score from 1 (low) to 5 (critical)"),
  summary: z.string().min(5).max(500).describe("A concise one-sentence summary"),
});
type Analysis = z.infer<typeof AnalysisSchema>;

const SYSTEM_PROMPT = `You are a feedback analysis expert. Analyze user feedback and classify it accurately.
Focus on identifying the core issue, sentiment, and business impact.`;

const DEFAULT_MODELS = {
  google: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
} as const;

type LLMOptions = {
  provider?: "google" | "openai" | "anthropic";
  model?: string;
  apiKey?: string;
};

function getModel(opts?: LLMOptions): LanguageModel {
  const provider = opts?.provider ?? "google";
  const modelName = opts?.model || DEFAULT_MODELS[provider];

  if (provider === "openai") {
    const apiKey = opts?.apiKey || process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY missing");
    }
    const openai = createOpenAI({ apiKey });
    return openai(modelName) as LanguageModel;
  }

  if (provider === "anthropic") {
    const apiKey = opts?.apiKey || process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY missing");
    }
    const anthropic = createAnthropic({ apiKey });
    return anthropic(modelName) as LanguageModel;
  }

  // Google provider
  if (opts?.apiKey) {
    const g = createGoogleGenerativeAI({ apiKey: opts.apiKey });
    return g(modelName) as unknown as LanguageModel;
  }
  return google(modelName) as unknown as LanguageModel;
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
        schemaName: "FeedbackAnalysis",
        schemaDescription: "Structured analysis of user feedback for product insights",
        schema: AnalysisSchema,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze this feedback:\n\n${text.slice(0, 8000)}` },
        ],
      });
      return object;
    } catch (err: unknown) {
      lastErr = err;

      // Log specific error details for debugging
      if (NoObjectGeneratedError.isInstance(err)) {
        const { text: generatedText, cause } = err;
        if (cause) {
          // Validation or parsing error - don't retry
          throw new Error(`LLM output invalid: ${cause}`);
        }
        // Model failed to generate - retry
        if (generatedText) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
      }

      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  if (lastErr) {
    throw lastErr;
  }
  throw new Error("LLM analysis failed after retries");
}
