/**
 * Feedback service for direct database queries
 */

import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { DEFAULT_FEEDBACK_LIMIT } from "@/lib/constants";
import type { FeedbackAnalysis, FeedbackItem, FeedbackStatus } from "@/lib/types";

interface RawFeedbackRow {
  id: string;
  source: string;
  raw_content: string;
  original_timestamp: Date | string | null;
  created_at: Date | string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  topics: Array<string> | null;
  severity_score: number | null;
  summary: string | null;
  status: "New" | "Acknowledged" | "Actioned" | null;
}

function transformFeedbackRow(row: RawFeedbackRow): FeedbackItem {
  const analysis: FeedbackAnalysis | null =
    row.sentiment == null
      ? null
      : {
          sentiment: row.sentiment,
          topics: (row.topics ?? []) as Array<string>,
          severity_score: row.severity_score ?? 0,
          summary: row.summary ?? "",
          status: (row.status ?? "New") as FeedbackStatus,
        };

  const createdAt = row.created_at;
  const originalTs = row.original_timestamp;

  return {
    id: row.id,
    source: row.source,
    raw_content: row.raw_content,
    original_timestamp:
      typeof originalTs === "string" ? originalTs : (originalTs?.toISOString() ?? ""),
    created_at: typeof createdAt === "string" ? createdAt : (createdAt?.toISOString() ?? ""),
    feedback_analyses: analysis,
  };
}

export async function getFeedbackItems(
  userId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<Array<FeedbackItem>> {
  const { limit = DEFAULT_FEEDBACK_LIMIT, offset = 0 } = options;

  const rows = await db
    .select({
      id: feedbackItems.id,
      source: feedbackItems.source,
      raw_content: feedbackItems.rawContent,
      original_timestamp: feedbackItems.originalTimestamp,
      created_at: feedbackItems.createdAt,
      sentiment: feedbackAnalyses.sentiment,
      topics: feedbackAnalyses.topics,
      severity_score: feedbackAnalyses.severityScore,
      summary: feedbackAnalyses.summary,
      status: feedbackAnalyses.status,
    })
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(eq(feedbackItems.userId, userId))
    .orderBy(desc(feedbackItems.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(transformFeedbackRow);
}

export async function getFeedbackItem(userId: string, itemId: string): Promise<FeedbackItem> {
  const [row] = await db
    .select({
      id: feedbackItems.id,
      source: feedbackItems.source,
      raw_content: feedbackItems.rawContent,
      original_timestamp: feedbackItems.originalTimestamp,
      created_at: feedbackItems.createdAt,
      sentiment: feedbackAnalyses.sentiment,
      topics: feedbackAnalyses.topics,
      severity_score: feedbackAnalyses.severityScore,
      summary: feedbackAnalyses.summary,
      status: feedbackAnalyses.status,
    })
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(and(eq(feedbackItems.userId, userId), eq(feedbackItems.id, itemId)))
    .limit(1);

  if (!row) {
    throw new Error("not found");
  }

  return transformFeedbackRow(row);
}
