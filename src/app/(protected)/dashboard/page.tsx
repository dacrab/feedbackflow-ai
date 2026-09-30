import "server-only";

import type { Metadata } from "next";
import { Card, MetricCard, PageHeader } from "@/components/ui/ui";
import { requireAuth } from "@/lib/api";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import { getDashboard } from "@/lib/services/dashboard-service";
import { SentimentChart, SeverityChart, TopicsChart, TrendChart } from "./charts";

export const metadata: Metadata = { title: "dashboard" };

function ChartCard({
  label,
  children,
  footer,
}: {
  label: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card title={label} className="min-w-0 overflow-hidden">
      <div className="h-48 w-full min-w-0">{children}</div>
      {footer}
    </Card>
  );
}

export default async function DashboardPage() {
  const userId = await requireAuth();
  const m = await getDashboard(userId);

  const trendData = m.trendLabels.map((label, i) => ({
    name: label,
    value: m.trendValues[i] ?? 0,
  }));
  const sentimentData = [
    { name: "positive", value: m.positive, color: "var(--color-chart-4)" },
    { name: "neutral", value: m.neutral, color: "var(--color-muted-foreground)" },
    { name: "negative", value: m.negative, color: "var(--color-chart-5)" },
  ];
  const severityData = Array.from({ length: MAX_SEVERITY }, (_, i) => ({
    name: String(i + 1),
    value: m.severityHist[i + 1] ?? 0,
  }));

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="overview" title="dashboard" />

      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        <MetricCard label="total" value={m.total} delta={m.trendDelta} note="vs prev day" />
        <MetricCard label="positive" value={`${m.positiveShare}%`} />
        <MetricCard
          label="critical"
          value={m.highSeverity}
          note={`severity ${HIGH_SEVERITY_THRESHOLD}+`}
        />
        <MetricCard label="avg severity" value={m.avgSeverity} note={`of ${MAX_SEVERITY}`} />
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <ChartCard label="trend">
          <TrendChart data={trendData} />
        </ChartCard>
        <ChartCard
          label="sentiment"
          footer={
            <div className="flex justify-center gap-4 text-xs">
              {sentimentData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
              ))}
            </div>
          }
        >
          <SentimentChart data={sentimentData} />
        </ChartCard>
        <ChartCard label="topics">
          <TopicsChart data={m.topTopics} />
        </ChartCard>
        <ChartCard label="severity distribution">
          <SeverityChart data={severityData} />
        </ChartCard>
      </div>
    </div>
  );
}
