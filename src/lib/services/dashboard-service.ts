import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems, feedbackTopics, feedbackTrend } from "@/db/schema";
import { DAY_MS, HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import { formatShortDate } from "@/lib/utils";

export interface DashboardData {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positiveShare: number;
  highSeverity: number;
  avgSeverity: string;
  trendLabels: string[];
  trendValues: number[];
  trendDelta: number;
  topTopics: Array<{ topic: string; value: number }>;
  severityHist: Record<number, number>;
}

interface SummaryRow {
  sentiment: string | null;
  cnt: number;
  highCnt: number;
  avgSev: string;
}

function aggregateSummary(rows: SummaryRow[]) {
  let total = 0;
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let highSeverity = 0;
  // Sum-weighted from the *unrounded* per-sentiment average, then rounded once
  // below; rounding each group first would skew the overall figure.
  let totalWeightedAvg = 0;

  for (const r of rows) {
    const c = r.cnt;
    total += c;
    highSeverity += r.highCnt;
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
  for (const r of rows) hist[r.score] = r.cnt;
  return hist;
}

const WINDOW_DAYS = 30;
const TOP_TOPICS = 10;

export async function getDashboard(userId: string): Promise<DashboardData> {
  const since = new Date(Date.now() - WINDOW_DAYS * DAY_MS);
  const sinceDay = sql`${since}::date`;
  // Bucket on when the feedback was filed, not when we scraped it, so a
  // backfilled repo does not render as a one-day spike. Matches the trend and
  // topic views, which also use original_timestamp.
  const base = and(eq(feedbackItems.userId, userId), gte(feedbackItems.originalTimestamp, since));

  const [summaryRows, severityRows, trendRows, topicRows] = await Promise.all([
    db
      .select({
        sentiment: feedbackAnalyses.sentiment,
        cnt: sql<number>`COUNT(*)::int`,
        highCnt: sql<number>`COUNT(*) FILTER (WHERE ${feedbackAnalyses.severityScore} >= ${HIGH_SEVERITY_THRESHOLD})::int`,
        // Unrounded: the caller weights this by group size and rounds once.
        avgSev: sql<string>`AVG(${feedbackAnalyses.severityScore})::numeric`,
      })
      .from(feedbackItems)
      .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
      .where(base)
      .groupBy(feedbackAnalyses.sentiment),

    db
      .select({
        score: feedbackAnalyses.severityScore,
        cnt: sql<number>`COUNT(*)::int`,
      })
      .from(feedbackItems)
      .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
      .where(base)
      .groupBy(feedbackAnalyses.severityScore),

    db
      .select({
        day: sql<string>`${feedbackTrend.day}::text`,
        // The view's COUNT/LAG are bigint; cast so the driver cannot hand back a string.
        cnt: sql<number>`${feedbackTrend.cnt}::int`,
        delta: sql<number>`${feedbackTrend.delta}::int`,
      })
      .from(feedbackTrend)
      .where(and(eq(feedbackTrend.userId, userId), gte(feedbackTrend.day, sinceDay)))
      .orderBy(feedbackTrend.day),

    db
      .select({
        topic: feedbackTopics.topic,
        cnt: sql<number>`${feedbackTopics.cnt}::int`,
      })
      .from(feedbackTopics)
      .where(and(eq(feedbackTopics.userId, userId), gte(feedbackTopics.day, sinceDay)))
      .orderBy(desc(feedbackTopics.cnt))
      .limit(TOP_TOPICS),
  ]);

  const { total, positive, neutral, negative, highSeverity, avgSeverity, positiveShare } =
    aggregateSummary(summaryRows);

  const severityHist = buildSeverityHist(severityRows);

  const trendData = trendRows.map((r) => ({
    day: r.day,
    cnt: r.cnt,
    delta: r.delta,
  }));
  const topTopics = topicRows.map((r) => ({
    topic: r.topic,
    value: r.cnt,
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
    trendLabels: trendData.map((r) => formatShortDate(r.day)),
    trendValues: trendData.map((r) => r.cnt),
    trendDelta: lastTrend?.delta ?? 0,
    topTopics,
    severityHist,
  };
}
