import { z } from "zod";
import type { ingestRuns } from "@/db/schema";
import { LLM_MAX_TOPICS, MAX_SEVERITY } from "@/lib/constants";

export const SENTIMENT_OPTIONS = ["positive", "neutral", "negative"] as const;
export type Sentiment = (typeof SENTIMENT_OPTIONS)[number];

export const FEEDBACK_STATUS_OPTIONS = ["New", "Acknowledged", "Actioned"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUS_OPTIONS)[number];

export const LLM_PROVIDER_IDS = ["google", "openai", "anthropic", "openrouter"] as const;
export type LLMProvider = (typeof LLM_PROVIDER_IDS)[number];

export const INBOX_SORT_OPTIONS = ["created_desc", "severity_desc", "severity_asc"] as const;
export type InboxSort = (typeof INBOX_SORT_OPTIONS)[number];
export const INBOX_SORT_LABELS: Record<InboxSort, string> = {
  created_desc: "newest",
  severity_desc: "severity ↓",
  severity_asc: "severity ↑",
};

export const LLMProviderSchema = z.enum(LLM_PROVIDER_IDS);
export const FeedbackStatusSchema = z.enum(FEEDBACK_STATUS_OPTIONS);
export const uuidSchema = z.uuid();

/** Shape the LLM is asked to return. Single source of truth: the schema
 *  validates the model output, and every downstream type is inferred from it. */
export const AnalysisSchema = z.object({
  sentiment: z.enum(SENTIMENT_OPTIONS),
  topics: z.array(z.string()).min(1).max(LLM_MAX_TOPICS),
  severity_score: z.number().int().min(1).max(MAX_SEVERITY),
  summary: z.string().min(5).max(200),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export interface FeedbackAnalysisData extends Analysis {
  status: FeedbackStatus;
}

export interface FeedbackItemWithAnalysis {
  id: string;
  source: string;
  raw_content: string;
  created_at: string;
  feedback_analyses: FeedbackAnalysisData | null;
}

export type IngestRunSummary = Pick<
  typeof ingestRuns.$inferSelect,
  "startedAt" | "finishedAt" | "ok" | "error" | "fetched" | "inserted" | "analyzed"
>;

export function isLLMProvider(val: unknown): val is LLMProvider {
  return LLMProviderSchema.safeParse(val).success;
}

export function isFeedbackStatus(val: unknown): val is FeedbackStatus {
  return FeedbackStatusSchema.safeParse(val).success;
}
