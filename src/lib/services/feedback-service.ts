import "server-only";

import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { DEFAULT_FEEDBACK_LIMIT } from "@/lib/constants";
import type { FeedbackItemWithAnalysis, FeedbackStatus, Sentiment } from "@/lib/types";

function parseTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string");
}

const feedbackSelect = {
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
} as const;

type FeedbackFilters = {
  sentiment?: Sentiment;
  status?: FeedbackStatus;
  topic?: string;
  q?: string;
  severityMin?: number;
  severityMax?: number;
  sort?: "created_desc" | "severity_desc" | "severity_asc";
};

type FeedbackRow = {
  id: string;
  source: string;
  raw_content: string;
  original_timestamp: Date;
  created_at: Date;
  sentiment: Sentiment | null;
  topics: unknown;
  severity_score: number | null;
  summary: string | null;
  status: FeedbackStatus | null;
};

function transformFeedbackRow(row: FeedbackRow): FeedbackItemWithAnalysis {
  return {
    id: row.id,
    source: row.source,
    raw_content: row.raw_content,
    original_timestamp: row.original_timestamp.toISOString(),
    created_at: row.created_at.toISOString(),
    feedback_analyses: row.sentiment
      ? {
          sentiment: row.sentiment,
          topics: parseTopics(row.topics),
          severity_score: row.severity_score ?? 0,
          summary: row.summary ?? "",
          status: row.status ?? "New",
        }
      : null,
  };
}

export async function getFeedbackItems(
  userId: string,
  options: { limit?: number; offset?: number; filters?: FeedbackFilters } = {},
): Promise<Array<FeedbackItemWithAnalysis>> {
  const { limit = DEFAULT_FEEDBACK_LIMIT, offset = 0, filters = {} } = options;

  const conditions = [eq(feedbackItems.userId, userId)];

  if (filters.sentiment) {
    conditions.push(sql`${feedbackAnalyses.sentiment} = ${filters.sentiment}`);
  }
  if (filters.status) {
    conditions.push(sql`${feedbackAnalyses.status} = ${filters.status}`);
  }
  if (filters.severityMin !== undefined) {
    conditions.push(gte(feedbackAnalyses.severityScore, filters.severityMin));
  }
  if (filters.severityMax !== undefined) {
    conditions.push(lte(feedbackAnalyses.severityScore, filters.severityMax));
  }
  if (filters.q) {
    const query = `%${filters.q.toLowerCase()}%`;
    const searchCondition = or(
      sql`LOWER(${feedbackItems.rawContent}) LIKE ${query}`,
      sql`LOWER(${feedbackAnalyses.summary}) LIKE ${query}`,
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  if (filters.topic) {
    conditions.push(sql`${feedbackAnalyses.topics} @> ${JSON.stringify([filters.topic])}`);
  }

  let orderBy = desc(feedbackItems.createdAt);
  if (filters.sort === "severity_desc") {
    orderBy = desc(feedbackAnalyses.severityScore);
  } else if (filters.sort === "severity_asc") {
    orderBy = asc(feedbackAnalyses.severityScore);
  }

  const rows = await db
    .select(feedbackSelect)
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return rows.map(transformFeedbackRow);
}

export async function getFeedbackItem(
  userId: string,
  itemId: string,
): Promise<FeedbackItemWithAnalysis> {
  const [row] = await db
    .select(feedbackSelect)
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(and(eq(feedbackItems.userId, userId), eq(feedbackItems.id, itemId)))
    .limit(1);

  if (!row) throw new Error("not found");

  return transformFeedbackRow(row);
}
