import "server-only";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import type { Sentiment } from "@/lib/types";

export interface ComputedMetrics {
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

export async function getDashboard(
  userId: string,
): Promise<ComputedMetrics & { severityHist: Record<number, number> }> {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);
  const base = and(eq(feedbackItems.userId, userId), gte(feedbackItems.createdAt, since));

  const [sentimentRows, severityRows, trendRows, topicRows] = await Promise.all([
    // sentiment counts + high severity + avg severity in one pass
    db
      .select({
        sentiment: feedbackAnalyses.sentiment,
        cnt: count(),
        highCnt: sql<number>`COUNT(*) FILTER (WHERE ${feedbackAnalyses.severityScore} >= ${HIGH_SEVERITY_THRESHOLD})`,
        avgSev: sql<number>`AVG(${feedbackAnalyses.severityScore})`,
      })
      .from(feedbackItems)
      .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
      .where(base)
      .groupBy(feedbackAnalyses.sentiment),

    // severity histogram
    db
      .select({
        score: feedbackAnalyses.severityScore,
        cnt: count(),
      })
      .from(feedbackItems)
      .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
      .where(base)
      .groupBy(feedbackAnalyses.severityScore),

    // daily trend
    db
      .select({
        day: sql<string>`DATE(${feedbackItems.createdAt})`,
        cnt: count(),
      })
      .from(feedbackItems)
      .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
      .where(base)
      .groupBy(sql`DATE(${feedbackItems.createdAt})`)
      .orderBy(sql`DATE(${feedbackItems.createdAt})`),

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

  const countsBySentiment: Partial<Record<Sentiment, number>> = {};
  let highSeverity = 0;
  let totalAvgSum = 0;
  let total = 0;

  for (const r of sentimentRows) {
    const c = Number(r.cnt);
    countsBySentiment[r.sentiment as Sentiment] = c;
    total += c;
    highSeverity += Number(r.highCnt);
    totalAvgSum += Number(r.avgSev) * c;
  }

  const positive = countsBySentiment["positive"] ?? 0;
  const neutral = countsBySentiment["neutral"] ?? 0;
  const negative = countsBySentiment["negative"] ?? 0;

  const severityHist: Record<number, number> = {};
  for (let i = 1; i <= MAX_SEVERITY; i++) severityHist[i] = 0;
  for (const r of severityRows) severityHist[r.score] = Number(r.cnt);

  const trendLabels = trendRows.map((r) => r.day);
  const trendValues = trendRows.map((r) => Number(r.cnt));

  const topTopics = (topicRows.rows as { topic: string; cnt: string }[]).map((r) => ({
    topic: r.topic,
    value: Number(r.cnt),
  }));

  return {
    total,
    positive,
    neutral,
    negative,
    positiveShare: total ? Math.round((positive / total) * 100) : 0,
    highSeverity,
    avgSeverity: total ? (totalAvgSum / total).toFixed(1) : "0.0",
    trendLabels,
    trendValues,
    trendDelta: (trendValues.at(-1) ?? 0) - (trendValues.at(-2) ?? 0),
    topTopics,
    severityHist,
  };
}
