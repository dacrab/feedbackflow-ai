export type Sentiment = "positive" | "neutral" | "negative";
export type FeedbackStatus = "New" | "Acknowledged" | "Actioned";
export type LLMProvider = "google" | "openai" | "anthropic";

export interface FeedbackAnalysis {
  sentiment: Sentiment;
  topics: Array<string>;
  severity_score: number;
  summary: string;
  status: FeedbackStatus;
}

export interface FeedbackItem {
  id: string;
  source: string;
  raw_content: string;
  original_timestamp: string;
  created_at: string;
  feedback_analyses: FeedbackAnalysis | null;
}

export function isLLMProvider(val: unknown): val is LLMProvider {
  return typeof val === "string" && ["google", "openai", "anthropic"].includes(val);
}

export interface TransformedSourceRow {
  id: string;
  type: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface TransformedNotificationRow {
  id: string;
  type: string;
  config: Record<string, unknown>;
  enabled: boolean;
}
