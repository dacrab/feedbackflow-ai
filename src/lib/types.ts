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

export interface TransformedConfigRow {
  id: string;
  type: string;
  config: Record<string, unknown> | null;
  enabled: boolean;
  hasSecret: boolean;
}

export type TransformedSourceRow = TransformedConfigRow;
export type TransformedNotificationRow = TransformedConfigRow;
