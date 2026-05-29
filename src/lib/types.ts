export type Sentiment = "positive" | "neutral" | "negative";
export type FeedbackStatus = "New" | "Acknowledged" | "Actioned";
export type LLMProvider = "google" | "openai" | "anthropic" | "openrouter";

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
  return typeof val === "string" && ["google", "openai", "anthropic", "openrouter"].includes(val);
}
