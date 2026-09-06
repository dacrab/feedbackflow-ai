import { z } from "zod";

export type Sentiment = "positive" | "neutral" | "negative";
export type FeedbackStatus = "New" | "Acknowledged" | "Actioned";
export const LLM_PROVIDER_IDS = ["google", "openai", "anthropic", "openrouter"] as const;
export type LLMProvider = (typeof LLM_PROVIDER_IDS)[number];

export interface IngestRunSummary {
  startedAt: Date;
  finishedAt: Date | null;
  ok: boolean | null;
  fetched: number | null;
  inserted: number | null;
  analyzed: number | null;
}

export const FEEDBACK_STATUS_OPTIONS = [
  "New",
  "Acknowledged",
  "Actioned",
] as const satisfies readonly FeedbackStatus[];
export const SENTIMENT_OPTIONS = [
  "positive",
  "neutral",
  "negative",
] as const satisfies readonly Sentiment[];

export const LLMProviderSchema = z.enum(LLM_PROVIDER_IDS);
export const FeedbackStatusSchema = z.enum(FEEDBACK_STATUS_OPTIONS);

export interface FeedbackAnalysisData {
  sentiment: Sentiment;
  topics: string[];
  severity_score: number;
  summary: string;
  status: FeedbackStatus;
}

export interface FeedbackItemWithAnalysis {
  id: string;
  source: string;
  raw_content: string;
  created_at: string;
  feedback_analyses: FeedbackAnalysisData | null;
}

export function isLLMProvider(val: unknown): val is LLMProvider {
  return LLMProviderSchema.safeParse(val).success;
}

export function isFeedbackStatus(val: unknown): val is FeedbackStatus {
  return FeedbackStatusSchema.safeParse(val).success;
}
