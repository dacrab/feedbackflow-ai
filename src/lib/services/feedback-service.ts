import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { MAX_SEARCH_TERM_LENGTH } from "@/lib/constants";
import { escapeLike } from "@/lib/sql";
import type {
  FeedbackAnalysisData,
  FeedbackItemWithAnalysis,
  FeedbackStatus,
  InboxSort,
  Sentiment,
} from "@/lib/types";

/** The list loads a prefix of each row; the full body stays on the detail page. */
const PREVIEW_CONTENT_CHARS = 240;

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

// FeedbackRow comes from the detail query (leftJoin) because its nullable
// analysis fields are the widest projection; list rows stay assignable.
const feedbackDetailQuery = (userId: string, itemId: string) =>
  db
    .select(feedbackSelect)
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(and(eq(feedbackItems.userId, userId), eq(feedbackItems.id, itemId)))
    .limit(1);

type FeedbackRow = Awaited<ReturnType<typeof feedbackDetailQuery>>[number];

/** An absent field means "not filtered on"; the explicit `| undefined` is
 *  required by exactOptionalPropertyTypes for a caller to omit the key. */
export interface FeedbackFilters {
  sentiment?: Sentiment | undefined;
  status?: FeedbackStatus | undefined;
  topic?: string | undefined;
  q?: string | undefined;
  sort?: InboxSort | undefined;
}

function buildFilterConditions(filters: FeedbackFilters, userId: string) {
  // Both ownership columns are pinned: it keeps the filter indexes usable and
  // makes the inbox refuse any row where they disagree.
  const conditions = [eq(feedbackItems.userId, userId), eq(feedbackAnalyses.userId, userId)];
  if (filters.sentiment) conditions.push(eq(feedbackAnalyses.sentiment, filters.sentiment));
  if (filters.status) conditions.push(eq(feedbackAnalyses.status, filters.status));
  if (filters.q) {
    const q = `%${escapeLike(filters.q.slice(0, MAX_SEARCH_TERM_LENGTH).toLowerCase())}%`;
    conditions.push(
      sql`(lower(${feedbackItems.rawContent}) LIKE ${q} ESCAPE '\\' OR lower(${feedbackAnalyses.summary}) LIKE ${q} ESCAPE '\\')`,
    );
  }
  if (filters.topic) {
    conditions.push(
      sql`${feedbackAnalyses.topics} @> ${JSON.stringify([filters.topic.slice(0, MAX_SEARCH_TERM_LENGTH)])}`,
    );
  }
  return conditions;
}

// A leftJoin makes each analysis column independently nullable in the types,
// though the row is all-or-nothing. sentiment is notNull, so it decides.
function hasAnalysis(row: FeedbackRow): row is FeedbackRow & FeedbackAnalysisData {
  return row.sentiment !== null;
}

function mapFeedbackRow(row: FeedbackRow): FeedbackItemWithAnalysis {
  return {
    id: row.id,
    source: row.source,
    raw_content: row.raw_content,
    created_at: row.created_at.toISOString(),
    feedback_analyses: hasAnalysis(row)
      ? {
          sentiment: row.sentiment,
          topics: row.topics,
          severity_score: row.severity_score,
          summary: row.summary,
          status: row.status,
        }
      : null,
  };
}

export async function getFeedbackItems(
  userId: string,
  options: { limit: number; offset: number; filters?: FeedbackFilters },
): Promise<{ items: FeedbackItemWithAnalysis[]; total: number }> {
  const { limit, offset, filters = {} } = options;

  // One CTE feeds the page and its filtered total; a `count(*) OVER ()` window
  // would make the planner materialize every matching row before emitting row 1.
  const page = db.$with("page").as(
    db
      .select(feedbackSelect)
      .from(feedbackItems)
      .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
      .where(and(...buildFilterConditions(filters, userId))),
  );

  // The list renders a one-line preview, so it does not need the full body.
  // Column names are listed rather than derived: reflection over drizzle's column
  // objects would be harder to read than the repetition it saved.
  const preview = {
    id: page.id,
    source: page.source,
    raw_content: sql<string>`left(${page.raw_content}, ${PREVIEW_CONTENT_CHARS})`,
    created_at: page.created_at,
    sentiment: page.sentiment,
    topics: page.topics,
    severity_score: page.severity_score,
    summary: page.summary,
    status: page.status,
  };

  function orderByFor(sort: InboxSort | undefined) {
    if (sort === "severity_desc") return desc(page.severity_score);
    if (sort === "severity_asc") return asc(page.severity_score);
    return desc(page.created_at);
  }
  const orderBy = orderByFor(filters.sort);

  const [countRows, rows] = await Promise.all([
    db.with(page).select({ total: sql<number>`count(*)::int` }).from(page),
    db.with(page).select(preview).from(page).orderBy(orderBy).limit(limit).offset(offset),
  ]);

  return { items: rows.map(mapFeedbackRow), total: Number(countRows[0]?.total ?? 0) };
}

// cache(): generateMetadata and the page body both read this row in the same
// render, so without it the detail page queries twice for one item.
export const getFeedbackItem = cache(
  async (userId: string, itemId: string): Promise<FeedbackItemWithAnalysis | null> => {
    const [row] = await feedbackDetailQuery(userId, itemId);
    return row ? mapFeedbackRow(row) : null;
  },
);
