import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { DEFAULT_DASHBOARD_LIMIT, HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";

interface DashboardData {
  countsBySentiment: Record<string, number>;
  topicCounts: Record<string, number>;
  severityHist: Record<string, number>;
  trendByDay: Record<string, number>;
}

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

async function getDashboardData(userId: string): Promise<DashboardData> {
  const rows = await db
    .select({
      sentiment: feedbackAnalyses.sentiment,
      topics: feedbackAnalyses.topics,
      severityScore: feedbackAnalyses.severityScore,
      createdAt: feedbackItems.createdAt,
    })
    .from(feedbackItems)
    .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .where(
      and(
        eq(feedbackItems.userId, userId),
        gte(feedbackItems.createdAt, new Date(Date.now() - THIRTY_DAYS_MS)),
      ),
    )
    .orderBy(desc(feedbackItems.createdAt))
    .limit(DEFAULT_DASHBOARD_LIMIT);

  const countsBySentiment: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  const severityHist: Record<string, number> = {};
  const trendByDay: Record<string, number> = {};

  for (const row of rows) {
    countsBySentiment[row.sentiment] = (countsBySentiment[row.sentiment] || 0) + 1;
    for (const topic of row.topics ?? []) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
    severityHist[row.severityScore] = (severityHist[row.severityScore] || 0) + 1;
    const day = row.createdAt.toISOString().slice(0, 10);
    if (day) trendByDay[day] = (trendByDay[day] || 0) + 1;
  }

  return { countsBySentiment, topicCounts, severityHist, trendByDay };
}

function computeMetrics(data: DashboardData): ComputedMetrics {
  const { countsBySentiment, topicCounts, severityHist, trendByDay } = data;

  const positive = countsBySentiment["positive"] ?? 0;
  const neutral = countsBySentiment["neutral"] ?? 0;
  const negative = countsBySentiment["negative"] ?? 0;
  const total = Object.values(countsBySentiment).reduce((a, b) => a + b, 0);

  let highSeverity = 0;
  for (let s = HIGH_SEVERITY_THRESHOLD; s <= MAX_SEVERITY; s++) {
    highSeverity += severityHist[s] ?? 0;
  }

  const avgSeverity = total
    ? (
        Object.entries(severityHist).reduce((acc, [s, v]) => acc + Number(s) * (v || 0), 0) / total
      ).toFixed(1)
    : "0.0";

  const trendLabels = Object.keys(trendByDay).sort();
  const trendValues = trendLabels.map((d) => trendByDay[d] ?? 0);
  const trendDelta = (trendValues.at(-1) ?? 0) - (trendValues.at(-2) ?? 0);

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3)
    .map(([topic, value]) => ({ topic, value }));

  return {
    total,
    positive,
    neutral,
    negative,
    positiveShare: total ? Math.round((positive / total) * 100) : 0,
    highSeverity,
    avgSeverity,
    trendLabels,
    trendValues,
    trendDelta,
    topTopics,
  };
}

export async function getDashboard(userId: string): Promise<ComputedMetrics & { severityHist: Record<string, number> }> {
  const data = await getDashboardData(userId);
  return { ...computeMetrics(data), severityHist: data.severityHist };
}