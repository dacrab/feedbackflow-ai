import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import {
  LLM_MAX_RETRIES,
  LLM_MAX_TOPICS,
  LLM_RETRY_BASE_DELAY_MS,
  MAX_LLM_INPUT_LENGTH,
} from "./constants";
import { withRetry } from "./retry";

const AnalysisSchema = z.object({
  sentiment: z
    .enum(["positive", "neutral", "negative"])
    .describe("Overall sentiment of the feedback"),
  topics: z
    .array(z.string())
    .min(1)
    .max(LLM_MAX_TOPICS)
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

function getModel(opts?: LLMOptions) {
  const provider = opts?.provider ?? "google";
  const modelName = opts?.model ?? DEFAULT_MODELS[provider];

  if (provider === "openai") {
    const apiKey = opts?.apiKey ?? process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY missing");
    }
    return createOpenAI({ apiKey })(modelName);
  }

  if (provider === "anthropic") {
    const apiKey = opts?.apiKey ?? process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY missing");
    }
    return createAnthropic({ apiKey })(modelName);
  }

  if (opts?.apiKey) {
    return createGoogleGenerativeAI({ apiKey: opts.apiKey })(modelName);
  }
  return google(modelName);
}

export async function analyzeFeedback(
  text: string,
  retries = LLM_MAX_RETRIES,
  opts?: LLMOptions,
): Promise<Analysis> {
  const model = getModel(opts);

  return withRetry(
    async () => {
      const { object } = await generateObject({
        model,
        schemaName: "FeedbackAnalysis",
        schemaDescription: "Structured analysis of user feedback for product insights",
        schema: AnalysisSchema,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this feedback:\n\n${text.slice(0, MAX_LLM_INPUT_LENGTH)}`,
          },
        ],
      });
      return object;
    },
    retries,
    LLM_RETRY_BASE_DELAY_MS,
  );
}
