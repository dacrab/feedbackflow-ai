import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";

const DASHBOARD_WINDOW_DAYS = 30;
const DASHBOARD_WINDOW_MS = DASHBOARD_WINDOW_DAYS * 24 * 60 * 60 * 1000;

interface ComputedMetrics {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positiveShare: number;
  highSeverity: number;
  avgSeverity: string;
  trendLabels: Array<string>;
  trendValues: Array<number>;
  trendDelta: number;
  topTopics: Array<{ topic: string; value: number }>;
}

export interface DashboardData extends ComputedMetrics {
  severityHist: Record<number, number>;
}

interface SummaryRow {
  sentiment: string | null;
  cnt: number;
  highCnt: number;
  avgSev: string;
}

interface TrendRow {
  day: string;
  cnt: number;
  delta: number;
}

function aggregateSummary(rows: SummaryRow[]) {
  let total = 0;
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let highSeverity = 0;
  let totalWeightedAvg = 0;

  for (const r of rows) {
    const c = Number(r.cnt);
    total += c;
    highSeverity += Number(r.highCnt);
    totalWeightedAvg += Number(r.avgSev) * c;
    if (r.sentiment === "positive") positive = c;
    else if (r.sentiment === "neutral") neutral = c;
    else if (r.sentiment === "negative") negative = c;
  }

  const positiveShare = total > 0 ? Math.round((positive / total) * 100) : 0;
  const avgSeverity = total > 0 ? (totalWeightedAvg / total).toFixed(1) : "0.0";

  return { total, positive, neutral, negative, highSeverity, avgSeverity, positiveShare };
}

function buildSeverityHist(rows: Array<{ score: number; cnt: number }>): Record<number, number> {
  const hist: Record<number, number> = {};
  for (let i = 1; i <= MAX_SEVERITY; i++) hist[i] = 0;
  for (const r of rows) hist[r.score] = Number(r.cnt);
  return hist;
}

export const getDashboard = cache(async (userId: string): Promise<DashboardData> => {
  const since = new Date(Date.now() - DASHBOARD_WINDOW_MS);
  const base = and(eq(feedbackItems.userId, userId), gte(feedbackItems.createdAt, since));

  const [summaryRows, severityRows, trendResult, topicResult] = await Promise.all([
    db
      .select({
        sentiment: feedbackAnalyses.sentiment,
        cnt: sql<number>`COUNT(*)`,
        highCnt: sql<number>`COUNT(*) FILTER (WHERE ${feedbackAnalyses.severityScore} >= ${HIGH_SEVERITY_THRESHOLD})`,
        avgSev: sql<string>`ROUND(AVG(${feedbackAnalyses.severityScore})::numeric, 1)`,
      })
      .from(feedbackItems)
      .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
      .where(base)
      .groupBy(feedbackAnalyses.sentiment),

    db
      .select({
        score: feedbackAnalyses.severityScore,
        cnt: sql<number>`COUNT(*)`,
      })
      .from(feedbackItems)
      .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
      .where(base)
      .groupBy(feedbackAnalyses.severityScore),

    db.execute(sql`
        SELECT
          DATE(fi.created_at) AS day,
          COUNT(*) AS cnt,
          COUNT(*) - LAG(COUNT(*), 1, COUNT(*)) OVER (ORDER BY DATE(fi.created_at)) AS delta
        FROM feedback_items fi
        INNER JOIN feedback_analyses fa ON fa.feedback_item_id = fi.id
        WHERE fi.user_id = ${userId}
          AND fi.created_at >= ${since}
        GROUP BY DATE(fi.created_at)
        ORDER BY DATE(fi.created_at)
      `),

    db.execute(sql`
        SELECT t.topic, COUNT(*) AS cnt
        FROM feedback_items fi
        INNER JOIN feedback_analyses fa ON fa.feedback_item_id = fi.id
        CROSS JOIN LATERAL jsonb_array_elements_text(fa.topics) AS t(topic)
        WHERE fi.user_id = ${userId}
          AND fi.created_at >= ${since}
        GROUP BY t.topic
        ORDER BY cnt DESC
        LIMIT 10
      `),
  ]);

  const { total, positive, neutral, negative, highSeverity, avgSeverity, positiveShare } =
    aggregateSummary(summaryRows);

  const severityHist = buildSeverityHist(severityRows);

  const trendRows = (trendResult.rows ?? []) as Array<Record<string, unknown>>;
  const trendData: TrendRow[] = trendRows.map((r) => ({
    day: String(r["day"]),
    cnt: Number(r["cnt"]),
    delta: Number(r["delta"]),
  }));
  const topicRows = (topicResult.rows ?? []) as Array<Record<string, unknown>>;
  const topTopics = topicRows.map((r) => ({
    topic: String(r["topic"]),
    value: Number(r["cnt"]),
  }));

  const lastTrend = trendData.at(-1);

  return {
    total,
    positive,
    neutral,
    negative,
    positiveShare,
    highSeverity,
    avgSeverity,
    trendLabels: trendData.map((r) => r.day),
    trendValues: trendData.map((r) => r.cnt),
    trendDelta: Number(lastTrend?.delta ?? 0),
    topTopics,
    severityHist,
  };
});
