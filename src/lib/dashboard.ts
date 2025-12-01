/**
 * Dashboard data processing utilities
 */

import type { DashboardData } from "@/lib/types";

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
  latestCount: number;
  trendDelta: number;
  trendDeltaLabel: string;
  trendMomentum: string;
  topTopics: Array<{ topic: string; value: number }>;
  topicLabels: Array<string>;
}

export function computeMetrics(data: DashboardData): ComputedMetrics {
  const { countsBySentiment, topicCounts, severityHist, trendByDay } = data;

  const positive = countsBySentiment["positive"] ?? 0;
  const neutral = countsBySentiment["neutral"] ?? 0;
  const negative = countsBySentiment["negative"] ?? 0;
  const total = positive + neutral + negative;

  const positiveShare = total ? Math.round((positive / total) * 100) : 0;
  const highSeverity = (severityHist["4"] ?? 0) + (severityHist["5"] ?? 0);

  const avgSeverity = total
    ? (
        Object.entries(severityHist).reduce(
          (acc, [score, val]) => acc + Number(score) * Number(val || 0),
          0,
        ) / total
      ).toFixed(1)
    : "0.0";

  const trendLabels = Object.keys(trendByDay).sort();
  const trendValues = trendLabels.map((d) => trendByDay[d] ?? 0);
  const latestCount = trendValues.at(-1) ?? 0;
  const previousCount = trendValues.at(-2) ?? 0;
  const trendDelta = latestCount - previousCount;

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3)
    .map(([topic, value]) => ({ topic, value }));

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
    latestCount,
    trendDelta,
    trendDeltaLabel: `${trendDelta >= 0 ? "+" : ""}${trendDelta}`,
    trendMomentum: trendDelta >= 0 ? "Accelerating" : "Cooling",
    topTopics,
    topicLabels: Object.keys(topicCounts),
  };
}
