import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardData } from "@/lib/types";
import { successResponse } from "@/lib/utils/api";
import { getDateString } from "@/lib/utils/date";
import { withAuthGet } from "@/lib/utils/route-handler";

export const GET = withAuthGet(async (user) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback_analyses")
    .select("sentiment, topics, severity_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);

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
    severityHist[row.severity_score as 1 | 2 | 3 | 4 | 5] =
      (severityHist[row.severity_score as 1 | 2 | 3 | 4 | 5] || 0) + 1;
    const day = getDateString(row.created_at as string);
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
