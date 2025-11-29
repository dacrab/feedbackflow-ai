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
import {
  type ComputedMetrics,
  chartOptions,
  computeMetrics,
  getSentimentChartData,
  getSeverityChartData,
  getTopicChartData,
  getTrendChartData,
} from "@/lib/dashboard";
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

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="metric-tile">
      <p className="text-xs uppercase text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-white/70">{helper}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card className="border border-border/60 bg-background/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function HeroSection({ metrics }: { metrics: ComputedMetrics }) {
  const tiles = [
    {
      label: "Total feedback",
      value: metrics.total,
      helper: `Last ingest captured ${metrics.latestCount} new items.`,
    },
    {
      label: "Positive share",
      value: `${metrics.positiveShare}%`,
      helper: `${metrics.positive} positive vs ${metrics.negative} negative.`,
    },
    {
      label: "Severity ≥ 4",
      value: metrics.highSeverity,
      helper: `Average severity ${metrics.avgSeverity}.`,
    },
  ];

  return (
    <Card className="hero-card">
      <div className="absolute inset-0 opacity-80">
        <div className="h-full w-full glow-hero-dark" />
      </div>
      <div className="relative space-y-6 p-6 sm:p-8">
        <div className="space-y-3">
          <span className="pulse-badge">Live pulse</span>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Insight dashboard
          </h1>
          <p className="max-w-3xl text-sm text-white/70">
            Monitor sentiment, severity, and trending topics across every feedback source in real
            time. Use these signals to prioritise fixes, celebrate wins, and broadcast alerts before
            issues escalate.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {tiles.map((t) => (
            <MetricTile key={t.label} {...t} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function DigestCard({ metrics }: { metrics: ComputedMetrics }) {
  return (
    <Card className="h-full border border-border/60 bg-background/85">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">Signal digest</CardTitle>
            <p className="text-xs text-muted-foreground">Today&apos;s automation summary</p>
          </div>
          <span className="momentum-badge">{metrics.trendMomentum}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-sm text-muted-foreground">
        <div className="digest-box">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Latest ingest</p>
          <p className="mt-2 text-foreground">
            Processed <span className="font-semibold">{metrics.latestCount}</span> items with a
            change of {metrics.trendDeltaLabel} vs the previous run.
          </p>
        </div>
        <ul className="space-y-3 text-sm leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              {metrics.positiveShare}% of customer feedback is positive. Keep the team informed of
              wins by highlighting them in the inbox.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-rose-400" />
            <span>
              {metrics.highSeverity} items flagged severity ≥ 4. Route the most recent ones into
              your response workflow within the next sprint.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
            <span>
              Enable Slack notifications in settings to broadcast new high severity feedback in real
              time.
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

function TopTopicsCard({ topics }: { topics: { topic: string; value: number }[] }) {
  return (
    <Card className="border border-border/60 bg-background/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase text-muted-foreground">Top topics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.length ? (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {topics.map(({ topic, value }) => (
              <li key={topic} className="topic-row">
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
  );
}

function SentimentLegend({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  const items = [
    { label: "Positive", value: positive },
    { label: "Neutral", value: neutral },
    { label: "Negative", value: negative },
  ];

  return (
    <div className="w-full space-y-2 text-xs text-muted-foreground">
      {items.map(({ label, value }) => (
        <div key={label} className="legend-row">
          <span>{label}</span>
          <span className="font-medium text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.text())))
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
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

  const metrics = computeMetrics(data);
  const sentimentData = getSentimentChartData(metrics.positive, metrics.neutral, metrics.negative);
  const topicData = getTopicChartData(data.topicCounts);
  const severityData = getSeverityChartData(data.severityHist);
  const trendData = getTrendChartData(metrics.trendLabels, metrics.trendValues);

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <HeroSection metrics={metrics} />
        <DigestCard metrics={metrics} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Queue momentum"
          value={metrics.trendDeltaLabel}
          description="Change in analysed items compared with the previous run"
        />
        <TopTopicsCard topics={metrics.topTopics} />
        <StatCard
          title="Neutral volume"
          value={metrics.neutral}
          description="Neutral classifier hits across the active window"
        />
        <StatCard
          title="Average severity"
          value={metrics.avgSeverity}
          description="Weighted mean severity across the dataset"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Daily intake trend
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Rolling count of analysed feedback per day
            </p>
          </CardHeader>
          <CardContent>
            <Line data={trendData} options={chartOptions.trend} height={260} />
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Sentiment distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <Pie data={sentimentData} options={chartOptions.sentiment} />
            <SentimentLegend
              positive={metrics.positive}
              neutral={metrics.neutral}
              negative={metrics.negative}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Topic clusters</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topicLabels.length ? (
              <Bar
                data={topicData}
                options={chartOptions.topic}
                height={Math.max(metrics.topicLabels.length * 32, 220)}
              />
            ) : (
              <div className="info-box text-sm text-muted-foreground">
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
            <Bar data={severityData} options={chartOptions.severity} height={240} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
