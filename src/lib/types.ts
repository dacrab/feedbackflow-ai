export type Sentiment = "positive" | "neutral" | "negative";
export type FeedbackStatus = "New" | "Acknowledged" | "Actioned";
export const LLM_PROVIDER_IDS = ["google", "openai", "anthropic", "openrouter"] as const;
export type LLMProvider = (typeof LLM_PROVIDER_IDS)[number];

export const FEEDBACK_STATUS_OPTIONS: FeedbackStatus[] = ["New", "Acknowledged", "Actioned"];
export const SENTIMENT_OPTIONS: Sentiment[] = ["positive", "neutral", "negative"];

export interface FeedbackAnalysisData {
  sentiment: Sentiment;
  topics: Array<string>;
  severity_score: number;
  summary: string;
  status: FeedbackStatus;
}

export interface FeedbackItemWithAnalysis {
  id: string;
  source: string;
  raw_content: string;
  original_timestamp: string;
  created_at: string;
  feedback_analyses: FeedbackAnalysisData | null;
}

export function isLLMProvider(val: unknown): val is LLMProvider {
  return typeof val === "string" && (LLM_PROVIDER_IDS as readonly string[]).includes(val);
}

export function isFeedbackStatus(val: unknown): val is FeedbackStatus {
  return typeof val === "string" && ["New", "Acknowledged", "Actioned"].includes(val);
}
