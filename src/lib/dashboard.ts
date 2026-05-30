import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";

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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getDashboard = cache(
  async (userId: string): Promise<ComputedMetrics & { severityHist: Record<number, number> }> => {
    const since = new Date(Date.now() - THIRTY_DAYS_MS);
    const base = and(eq(feedbackItems.userId, userId), gte(feedbackItems.createdAt, since));

    const [summaryRows, severityRows, trendRows, topicRows] = await Promise.all([
      // counts + high severity + avg severity + positive share in one pass
      db
        .select({
          sentiment: feedbackAnalyses.sentiment,
          cnt: sql<number>`COUNT(*)`,
          highCnt: sql<number>`COUNT(*) FILTER (WHERE ${feedbackAnalyses.severityScore} >= ${HIGH_SEVERITY_THRESHOLD})`,
          avgSev: sql<string>`ROUND(AVG(${feedbackAnalyses.severityScore})::numeric, 1)`,
          positiveShare: sql<number>`ROUND(100.0 * COUNT(*) FILTER (WHERE ${feedbackAnalyses.sentiment} = 'positive') / NULLIF(COUNT(*), 0))`,
        })
        .from(feedbackItems)
        .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
        .where(base)
        .groupBy(feedbackAnalyses.sentiment),

      // severity histogram
      db
        .select({
          score: feedbackAnalyses.severityScore,
          cnt: sql<number>`COUNT(*)`,
        })
        .from(feedbackItems)
        .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
        .where(base)
        .groupBy(feedbackAnalyses.severityScore),

      // daily trend with delta via window function
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

      // top topics via unnest
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

    let total = 0;
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    let highSeverity = 0;
    let avgSeverity = "0.0";
    let positiveShare = 0;
    let totalWeightedAvg = 0;

    for (const r of summaryRows) {
      const c = Number(r.cnt);
      total += c;
      highSeverity += Number(r.highCnt);
      totalWeightedAvg += Number(r.avgSev) * c;
      if (r.sentiment === "positive") positive = c;
      else if (r.sentiment === "neutral") neutral = c;
      else if (r.sentiment === "negative") negative = c;
    }

    if (total > 0) {
      positiveShare = Math.round((positive / total) * 100);
      avgSeverity = (totalWeightedAvg / total).toFixed(1);
    }

    const severityHist: Record<number, number> = {};
    for (let i = 1; i <= MAX_SEVERITY; i++) severityHist[i] = 0;
    for (const r of severityRows) severityHist[r.score] = Number(r.cnt);

    type TrendRow = { day: string; cnt: string; delta: string };
    const trendData = trendRows.rows as TrendRow[];
    const trendLabels = trendData.map((r) => r.day);
    const trendValues = trendData.map((r) => Number(r.cnt));
    const trendDelta = Number(trendData.at(-1)?.delta ?? 0);

    const topTopics = (topicRows.rows as { topic: string; cnt: string }[]).map((r) => ({
      topic: r.topic,
      value: Number(r.cnt),
    }));

    return {
      total,
      positive,
      neutral,
      negative,
      positiveShare,
      highSeverity,
      avgSeverity,
      trendLabels,
      trendValues,
      trendDelta,
      topTopics,
      severityHist,
    };
  },
);
