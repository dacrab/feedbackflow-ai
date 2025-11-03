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
import type { DashboardData } from "@/lib/types";

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
      <div className="rounded-2xl border border-red-200/70 bg-red-50/80 p-6 text-sm text-red-600">
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
  const trendMomentum = trendDelta >= 0 ? "Accelerating" : "Cooling";

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3)
    .map(([topic, value]) => ({ topic, value }));

  const palette = {
    positive: "#22c55e",
    neutral: "#94a3b8",
    negative: "#ef4444",
    accent: "#2563eb",
    accentSoft: "rgba(37, 99, 235, 0.18)",
  } as const;

  const metricTiles = [
    {
      label: "Total feedback",
      value: totalFeedback,
      helper: `Last ingest captured ${latestCount} new items.`,
    },
    {
      label: "Positive share",
      value: `${positiveShare}%`,
      helper: `${positive} positive vs ${negative} negative.`,
    },
    {
      label: "Severity ≥ 4",
      value: highSeverity,
      helper: `Average severity ${avgSeverity}.`,
    },
  ];

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
      tooltip: {
        callbacks: {
          label: (tooltipItem: { label?: string; raw?: unknown }) => {
            const label = tooltipItem.label || "";
            const value = typeof tooltipItem.raw === "number" ? tooltipItem.raw : 0;
            return `${label}: ${value}`;
          },
        },
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
        borderRadius: 10,
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
        grid: { color: "rgba(148, 163, 184, 0.12)" },
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
        borderRadius: 10,
        borderSkipped: false,
        borderColor: "rgba(14, 165, 233, 0.42)",
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
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        border: { display: false },
      },
      y: {
        ticks: { color: "#64748b", precision: 0 },
        grid: { color: "rgba(148, 163, 184, 0.1)" },
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
        grid: { color: "rgba(148, 163, 184, 0.08)" },
        border: { display: false },
      },
      y: {
        ticks: { color: "#64748b", precision: 0 },
        grid: { color: "rgba(148, 163, 184, 0.08)" },
        border: { display: false },
      },
    },
  };

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="relative overflow-hidden border border-border/50 bg-[linear-gradient(135deg,rgba(37,99,235,0.16),rgba(15,23,42,0.18))]">
          <div className="absolute inset-0 opacity-80">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(12,74,110,0.25),transparent_72%)]" />
          </div>
          <div className="relative space-y-6 p-6 sm:p-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase text-white/80">
                Live pulse
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Insight dashboard
              </h1>
              <p className="max-w-3xl text-sm text-white/70">
                Monitor sentiment, severity, and trending topics across every feedback source in
                real time. Use these signals to prioritise fixes, celebrate wins, and broadcast
                alerts before issues escalate.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {metricTiles.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur transition hover:border-white/20"
                >
                  <p className="text-xs uppercase text-white/70">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                  <p className="mt-2 text-xs text-white/70">{metric.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="h-full border border-border/60 bg-background/85">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Signal digest
                </CardTitle>
                <p className="text-xs text-muted-foreground">Today&apos;s automation summary</p>
              </div>
              <span className="rounded-full bg-[color-mix(in_oklab,var(--accent)_22%,transparent)] px-3 py-1 text-[11px] font-semibold uppercase text-foreground">
                {trendMomentum}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/50 bg-background/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Latest ingest</p>
              <p className="mt-2 text-foreground">
                Processed <span className="font-semibold">{latestCount}</span> items with a change
                of {trendDeltaLabel} vs the previous run.
              </p>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                <span>
                  {positiveShare}% of customer feedback is positive. Keep the team informed of wins
                  by highlighting them in the inbox.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-rose-400" />
                <span>
                  {highSeverity} items flagged severity ≥ 4. Route the most recent ones into your
                  response workflow within the next sprint.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                <span>
                  Enable Slack notifications in settings to broadcast new high severity feedback in
                  real time.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-border/60 bg-background/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              Queue momentum
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold text-foreground">{trendDeltaLabel}</p>
            <p className="text-xs text-muted-foreground">
              Change in analysed items compared with the previous run
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-background/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Top topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTopics.length ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {topTopics.map(({ topic, value }) => (
                  <li
                    key={topic}
                    className="flex items-center justify-between rounded-xl bg-background/60 px-3 py-2"
                  >
                    <span className="font-medium text-foreground">{topic}</span>
                    <span className="text-xs text-muted-foreground">{value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No topic clusters yet.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-background/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              Neutral volume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold text-foreground">{neutral}</p>
            <p className="text-xs text-muted-foreground">
              Neutral classifier hits across the active window
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-background/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              Average severity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold text-foreground">{avgSeverity}</p>
            <p className="text-xs text-muted-foreground">
              Weighted mean severity across the dataset
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Daily intake trend
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Rolling count of analysed feedback per day
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Line data={trendData} options={trendOptions} height={260} />
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Sentiment distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <Pie data={sentimentData} options={sentimentOptions} />
            <div className="w-full space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2">
                <span>Positive</span>
                <span className="font-medium text-foreground">{positive}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2">
                <span>Neutral</span>
                <span className="font-medium text-foreground">{neutral}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2">
                <span>Negative</span>
                <span className="font-medium text-foreground">{negative}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Topic clusters</CardTitle>
          </CardHeader>
          <CardContent>
            {topicLabels.length ? (
              <Bar
                data={topicData}
                options={topicOptions}
                height={Math.max(topicLabels.length * 32, 220)}
              />
            ) : (
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-6 text-sm text-muted-foreground">
                No topics yet. Ingest more feedback to classify emerging themes.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Severity distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={severityData} options={severityOptions} height={240} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
