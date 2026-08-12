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
  created_at: feedbackItems.createdAt,
  sentiment: feedbackAnalyses.sentiment,
  topics: feedbackAnalyses.topics,
  severity_score: feedbackAnalyses.severityScore,
  summary: feedbackAnalyses.summary,
  status: feedbackAnalyses.status,
} as const;

// The widest projection is the detail query (leftJoin), so its nullable
// analysis fields drive FeedbackRow; list (innerJoin) rows stay assignable.
const feedbackDetailQuery = (userId: string, itemId: string) =>
  db
    .select(feedbackSelect)
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(and(eq(feedbackItems.userId, userId), eq(feedbackItems.id, itemId)))
    .limit(1);

type FeedbackRow = Awaited<ReturnType<typeof feedbackDetailQuery>>[number];

function buildFilterConditions(filters: FeedbackFilters, userId: string) {
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
  if (filters.topic) {
    const topic = filters.topic.slice(0, MAX_SEARCH_TERM_LENGTH);
    conditions.push(sql`${feedbackAnalyses.topics} @> ${JSON.stringify([topic])}`);
  }
  return conditions;
}

export type FeedbackFilters = {
  sentiment?: Sentiment;
  status?: FeedbackStatus;
  topic?: string;
  q?: string;
  severityMin?: number;
  severityMax?: number;
  sort?: "created_desc" | "severity_desc" | "severity_asc";
};

export async function getFeedbackItems(
  userId: string,
  options: { limit?: number; offset?: number; filters?: FeedbackFilters } = {},
): Promise<FeedbackItemWithAnalysis[]> {
  const { limit = DEFAULT_FEEDBACK_LIMIT, offset = 0, filters = {} } = options;
  const conditions = buildFilterConditions(filters, userId);

  const orderBy =
    filters.sort === "severity_desc"
      ? desc(feedbackAnalyses.severityScore)
      : filters.sort === "severity_asc"
        ? asc(feedbackAnalyses.severityScore)
        : desc(feedbackItems.createdAt);

  const rows = await db
    .select(feedbackSelect)
    .from(feedbackItems)
    .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
  return rows.map(mapFeedbackRow);
}

function mapFeedbackRow(row: FeedbackRow): FeedbackItemWithAnalysis {
  return {
    id: row.id,
    source: row.source,
    raw_content: row.raw_content,
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

export async function getFeedbackCount(
  userId: string,
  filters: FeedbackFilters = {},
): Promise<number> {
  const conditions = buildFilterConditions(filters, userId);

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
): Promise<FeedbackItemWithAnalysis | null> {
  const [row] = await feedbackDetailQuery(userId, itemId);
  return row ? mapFeedbackRow(row) : null;
}
