/**
 * Centralized type definitions
 */

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

export interface TransformedSourceRow {
  id: string;
  type: string;
  config: Record<string, unknown> | null;
  enabled: boolean;
  hasSecret: boolean;
}

export interface TransformedNotificationRow {
  id: string;
  type: string;
  config: Record<string, unknown> | null;
  enabled: boolean;
  hasSecret: boolean;
}

export interface FeedbackFilterParams {
  sentiment?: Sentiment | undefined;
  topic?: string | undefined;
  status?: FeedbackStatus | undefined;
  q?: string | undefined;
  severity_min?: number | undefined;
  severity_max?: number | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}


