import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import {
  filterFeedbackItems,
  parseFeedbackFilters,
  parsePagination,
} from "@/lib/services/query-builder";
import type { FeedbackItem, FeedbackStatus, PaginatedResponse } from "@/lib/types";
import { successResponse } from "@/lib/utils/api";
import { withAuthRequest } from "@/lib/utils/route-handler";

export const GET = withAuthRequest(async (req, user) => {
  const { searchParams } = new URL(req.url);

  const { page, limit, offset } = parsePagination(searchParams);
  const filters = parseFeedbackFilters(searchParams);

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
    .where(eq(feedbackItems.userId, user.id))
    .orderBy(desc(feedbackItems.createdAt))
    .limit(limit)
    .offset(offset);

  const items: FeedbackItem[] = rows.map((row) => {
    const analysis =
      row.sentiment == null
        ? null
        : {
            sentiment: row.sentiment,
            topics: (row.topics ?? []) as string[],
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
  });

  const filtered = filterFeedbackItems(items, filters);

  const response: PaginatedResponse<FeedbackItem> = {
    page,
    limit,
    items: filtered,
  };

  return successResponse(response);
});
