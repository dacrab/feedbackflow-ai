/**
 * Dashboard data processing utilities
 */

import type { DashboardData } from "@/lib/types";

const COLORS = {
  positive: "#22c55e",
  neutral: "#94a3b8",
  negative: "#ef4444",
  accent: "#2563eb",
  accentSoft: "rgba(37, 99, 235, 0.18)",
  sky: "rgba(14, 165, 233, 0.18)",
  skyBorder: "rgba(14, 165, 233, 0.42)",
  accentBorder: "rgba(37, 99, 235, 0.35)",
  gridLight: "rgba(148, 163, 184, 0.12)",
  gridLighter: "rgba(148, 163, 184, 0.08)",
  textMuted: "#64748b",
  textDark: "#475569",
} as const;

export interface ComputedMetrics {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positiveShare: number;
  highSeverity: number;
  avgSeverity: string;
  trendLabels: string[];
  trendValues: number[];
  latestCount: number;
  trendDelta: number;
  trendDeltaLabel: string;
  trendMomentum: string;
  topTopics: { topic: string; value: number }[];
  topicLabels: string[];
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

export function getSentimentChartData(positive: number, neutral: number, negative: number) {
  return {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [positive, neutral, negative],
        backgroundColor: [COLORS.positive, COLORS.neutral, COLORS.negative],
        borderWidth: 0,
      },
    ],
  };
}

export function getTopicChartData(topicCounts: Record<string, number>) {
  return {
    labels: Object.keys(topicCounts),
    datasets: [
      {
        data: Object.values(topicCounts),
        backgroundColor: COLORS.accentSoft,
        borderRadius: 10,
        borderSkipped: false,
        borderColor: COLORS.accentBorder,
      },
    ],
  };
}

export function getSeverityChartData(severityHist: Record<string, number>) {
  return {
    labels: ["1", "2", "3", "4", "5"],
    datasets: [
      {
        data: [1, 2, 3, 4, 5].map((s) => severityHist[String(s)] ?? 0),
        backgroundColor: COLORS.sky,
        borderRadius: 10,
        borderSkipped: false,
        borderColor: COLORS.skyBorder,
      },
    ],
  };
}

export function getTrendChartData(labels: string[], values: number[]) {
  return {
    labels,
    datasets: [
      {
        label: "Ingested",
        data: values,
        borderColor: COLORS.accent,
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };
}

export const chartOptions = {
  sentiment: {
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: COLORS.textMuted, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (item: { label?: string; raw?: unknown }) =>
            `${item.label || ""}: ${typeof item.raw === "number" ? item.raw : 0}`,
        },
      },
    },
  },
  topic: {
    indexAxis: "y" as const,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: {
        ticks: { color: COLORS.textMuted },
        grid: { color: COLORS.gridLight },
        border: { display: false },
      },
      y: {
        ticks: { color: COLORS.textDark },
        grid: { display: false },
        border: { display: false },
      },
    },
  },
  severity: {
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: COLORS.textMuted },
        grid: { color: COLORS.gridLight },
        border: { display: false },
      },
      y: {
        ticks: { color: COLORS.textMuted, precision: 0 },
        grid: { color: COLORS.gridLight },
        border: { display: false },
      },
    },
  },
  trend: {
    plugins: { legend: { display: false }, tooltip: { intersect: false } },
    scales: {
      x: {
        ticks: { color: COLORS.textMuted },
        grid: { color: COLORS.gridLighter },
        border: { display: false },
      },
      y: {
        ticks: { color: COLORS.textMuted, precision: 0 },
        grid: { color: COLORS.gridLighter },
        border: { display: false },
      },
    },
  },
};
