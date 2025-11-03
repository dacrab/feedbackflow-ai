"use client";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardData = {
  countsBySentiment: Record<string, number>;
  topicCounts: Record<string, number>;
  severityHist: Record<string, number>;
  trendByDay: Record<string, number>;
};

Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        setData(await res.json());
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    }
    loadData();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
        Error loading dashboard: {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">Loading…</div>
    );
  }

  const { countsBySentiment: sentiments, topicCounts, severityHist, trendByDay } = data;

  const totalFeedback = Object.values(sentiments).reduce((acc, v) => acc + v, 0);
  const positive = sentiments["positive"] ?? 0;
  const neutral = sentiments["neutral"] ?? 0;
  const negative = sentiments["negative"] ?? 0;
  const positiveShare = totalFeedback ? Math.round((positive / totalFeedback) * 100) : 0;
  const highSeverity = (severityHist["4"] ?? 0) + (severityHist["5"] ?? 0);
  const avgSeverity = totalFeedback
    ? (
        Object.entries(severityHist).reduce(
          (acc, [score, value]) => acc + Number(score) * Number(value || 0),
          0,
        ) / totalFeedback
      ).toFixed(1)
    : "0.0";

  const trendLabels = Object.keys(trendByDay).sort();
  const trendValues = trendLabels.map((d) => trendByDay[d] ?? 0);
  const latestCount = trendValues.at(-1) ?? 0;
  const previousCount = trendValues.at(-2) ?? 0;
  const trendDelta = latestCount - previousCount;
  const trendDeltaLabel = `${trendDelta >= 0 ? "+" : ""}${trendDelta}`;

  const palette = {
    positive: "#22c55e",
    neutral: "#94a3b8",
    negative: "#ef4444",
    accent: "#2563eb",
    accentSoft: "rgba(37, 99, 235, 0.18)",
  };

  const sentimentData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [positive, neutral, negative],
        backgroundColor: [palette.positive, palette.neutral, palette.negative],
        borderWidth: 0,
      },
    ],
  };

  const sentimentOptions = {
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "#64748b", usePointStyle: true },
      },
    },
  };

  const topicLabels = Object.keys(topicCounts);
  const topicValues = Object.values(topicCounts);
  const topicData = {
    labels: topicLabels,
    datasets: [
      {
        data: topicValues,
        backgroundColor: palette.accentSoft,
        borderRadius: 8,
        borderSkipped: false,
        borderColor: "rgba(37, 99, 235, 0.35)",
      },
    ],
  };

  const topicOptions = {
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        ticks: { color: "#64748b" },
        grid: { color: "rgba(148, 163, 184, 0.15)" },
        border: { display: false },
      },
      y: {
        ticks: { color: "#475569" },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  const severityData = {
    labels: ["1", "2", "3", "4", "5"],
    datasets: [
      {
        data: [1, 2, 3, 4, 5].map((s) => severityHist[String(s)] ?? 0),
        backgroundColor: "rgba(14, 165, 233, 0.18)",
        borderRadius: 8,
        borderSkipped: false,
        borderColor: "rgba(14, 165, 233, 0.4)",
      },
    ],
  };

  const severityOptions = {
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: "#64748b" },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        border: { display: false },
      },
      y: {
        ticks: { color: "#64748b", precision: 0 },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        border: { display: false },
      },
    },
  };

  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Ingested",
        data: trendValues,
        borderColor: palette.accent,
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const trendOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false },
    },
    scales: {
      x: {
        ticks: { color: "#64748b" },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        border: { display: false },
      },
      y: {
        ticks: { color: "#64748b", precision: 0 },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        border: { display: false },
      },
    },
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">Insight dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Daily ingest summaries with live sentiment, topics, and severity signals.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50 bg-[color-mix(in_oklab,var(--background)_95%,transparent)]">
          <CardHeader className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <CardTitle className="text-xs">Total feedback</CardTitle>
            <span className="badge text-[10px]">Last 30 days</span>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold">{totalFeedback}</div>
            <div className="text-xs text-muted-foreground">
              Latest ingest: {latestCount} items · Change {trendDeltaLabel} vs previous run
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-[color-mix(in_oklab,var(--accent)_6%,var(--background))]">
          <CardHeader className="mb-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <CardTitle className="text-xs">Positive share</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold">{positiveShare}%</div>
            <div className="text-xs text-muted-foreground">
              {positive} positive · {neutral} neutral · {negative} negative
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="mb-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <CardTitle className="text-xs">High severity (≥4)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold">{highSeverity}</div>
            <div className="text-xs text-muted-foreground">Avg severity score {avgSeverity}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-[color-mix(in_oklab,var(--background)_95%,transparent)]">
          <CardHeader className="mb-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <CardTitle className="text-xs">Latest run</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Daily cron executed with <span className="font-medium text-foreground">{latestCount}</span> new records.</p>
            <p>Enable Slack notifications to broadcast severity ≥ 4 instantly.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="border-border/50">
          <CardHeader className="mb-3 flex items-center justify-between">
            <div>
              <CardTitle className="text-xs">Trend of ingested items</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Rolling count of analyzed feedback per day.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Line data={trendData} options={trendOptions} height={220} />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="mb-3">
            <CardTitle className="text-xs">Sentiment distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <Pie data={sentimentData} options={sentimentOptions} />
            <div className="w-full space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_93%,transparent)] px-3 py-2">
                <span>Positive</span>
                <span className="font-medium text-foreground">{positive}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_93%,transparent)] px-3 py-2">
                <span>Neutral</span>
                <span className="font-medium text-foreground">{neutral}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_93%,transparent)] px-3 py-2">
                <span>Negative</span>
                <span className="font-medium text-foreground">{negative}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="mb-3">
            <CardTitle className="text-xs">Top topics</CardTitle>
          </CardHeader>
          <CardContent>
            {topicLabels.length ? (
              <Bar data={topicData} options={topicOptions} height={topicLabels.length * 32} />
            ) : (
              <div className="text-sm text-muted-foreground">No topics yet. Ingest more feedback to classify themes.</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="mb-3">
            <CardTitle className="text-xs">Severity distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={severityData} options={severityOptions} height={220} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
