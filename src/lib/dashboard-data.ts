import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses } from "@/db/schema";
import { getDateString } from "@/lib/utils/date";
import type { DashboardData } from "@/lib/types";

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const data = await db
    .select({
      sentiment: feedbackAnalyses.sentiment,
      topics: feedbackAnalyses.topics,
      severityScore: feedbackAnalyses.severityScore,
      createdAt: feedbackAnalyses.createdAt,
    })
    .from(feedbackAnalyses)
    .where(eq(feedbackAnalyses.userId, userId))
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
    const sev = row.severityScore as 1 | 2 | 3 | 4 | 5;
    severityHist[sev] = (severityHist[sev] || 0) + 1;

    if (!row.createdAt) continue;
    const day = getDateString(row.createdAt);
    trendByDay[day] = (trendByDay[day] || 0) + 1;
  }

  return {
    countsBySentiment,
    topicCounts,
    severityHist,
    trendByDay,
  };
}
