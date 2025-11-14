import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses } from "@/db/schema";
import type { DashboardData } from "@/lib/types";
import { successResponse } from "@/lib/utils/api";
import { getDateString } from "@/lib/utils/date";
import { withAuthGet } from "@/lib/utils/route-handler";

export const GET = withAuthGet(async (user) => {
  const data = await db
    .select({
      sentiment: feedbackAnalyses.sentiment,
      topics: feedbackAnalyses.topics,
      severityScore: feedbackAnalyses.severityScore,
      createdAt: feedbackAnalyses.createdAt,
    })
    .from(feedbackAnalyses)
    .where(eq(feedbackAnalyses.userId, user.id))
    .orderBy(desc(feedbackAnalyses.createdAt))
    .limit(1000);

  const countsBySentiment: Record<string, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  const topicCounts: Record<string, number> = {};
  const severityHist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const trendByDay: Record<string, number> = {};

  for (const row of data || []) {
    countsBySentiment[row.sentiment] = (countsBySentiment[row.sentiment] || 0) + 1;
    if (Array.isArray(row.topics)) {
      for (const t of row.topics) topicCounts[t] = (topicCounts[t] || 0) + 1;
    }
    severityHist[row.severityScore as 1 | 2 | 3 | 4 | 5] =
      (severityHist[row.severityScore as 1 | 2 | 3 | 4 | 5] || 0) + 1;
    if (!row.createdAt) continue;
    const day = getDateString(row.createdAt);
    trendByDay[day] = (trendByDay[day] || 0) + 1;
  }

  const dashboardData: DashboardData = {
    countsBySentiment,
    topicCounts,
    severityHist,
    trendByDay,
  };

  return successResponse(dashboardData);
});
