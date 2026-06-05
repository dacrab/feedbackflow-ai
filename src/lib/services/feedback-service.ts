import "server-only";

import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { DEFAULT_FEEDBACK_LIMIT, MAX_SEARCH_TERM_LENGTH } from "@/lib/constants";
import type { FeedbackItemWithAnalysis, FeedbackStatus, Sentiment } from "@/lib/types";

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

export type FeedbackFilters = {
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
  topics: string[] | null;
  severity_score: number | null;
  summary: string | null;
  status: FeedbackStatus | null;
};

function transform(row: FeedbackRow): FeedbackItemWithAnalysis {
  return {
    id: row.id,
    source: row.source,
    raw_content: row.raw_content,
    original_timestamp: row.original_timestamp.toISOString(),
    created_at: row.created_at.toISOString(),
    feedback_analyses: row.sentiment
      ? {
          sentiment: row.sentiment,
          topics: row.topics ?? [],
          severity_score: row.severity_score ?? 0,
          summary: row.summary ?? "",
          status: row.status ?? "New",
        }
      : null,
  };
}

function buildConditions(userId: string, filters: FeedbackFilters) {
  const conditions = [eq(feedbackItems.userId, userId)];
  if (filters.sentiment) conditions.push(eq(feedbackAnalyses.sentiment, filters.sentiment));
  if (filters.status) conditions.push(eq(feedbackAnalyses.status, filters.status));
  if (filters.severityMin !== undefined)
    conditions.push(gte(feedbackAnalyses.severityScore, filters.severityMin));
  if (filters.severityMax !== undefined)
    conditions.push(lte(feedbackAnalyses.severityScore, filters.severityMax));
  if (filters.q) {
    const q = `%${filters.q.slice(0, MAX_SEARCH_TERM_LENGTH).toLowerCase()}%`;
    const cond = or(
      sql`LOWER(${feedbackItems.rawContent}) LIKE ${q}`,
      sql`LOWER(${feedbackAnalyses.summary}) LIKE ${q}`,
    );
    if (cond) conditions.push(cond);
  }
  if (filters.topic)
    conditions.push(sql`${feedbackAnalyses.topics} @> ${JSON.stringify([filters.topic])}`);
  return conditions;
}

function buildOrder(filters: FeedbackFilters) {
  return filters.sort === "severity_desc"
    ? desc(feedbackAnalyses.severityScore)
    : filters.sort === "severity_asc"
      ? asc(feedbackAnalyses.severityScore)
      : desc(feedbackItems.createdAt);
}

export async function getFeedbackItems(
  userId: string,
  options: { limit?: number; offset?: number; filters?: FeedbackFilters } = {},
): Promise<FeedbackItemWithAnalysis[]> {
  const { limit = DEFAULT_FEEDBACK_LIMIT, offset = 0, filters = {} } = options;
  const conditions = buildConditions(userId, filters);
  const orderBy = buildOrder(filters);

  const rows = await db
    .select(feedbackSelect)
    .from(feedbackItems)
    .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
  return rows.map(transform);
}

export async function getFeedbackCount(
  userId: string,
  filters: FeedbackFilters = {},
): Promise<number> {
  const conditions = buildConditions(userId, filters);

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackItems)
    .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(and(...conditions));
  return Number(row?.count ?? 0);
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
  return transform(row);
}
