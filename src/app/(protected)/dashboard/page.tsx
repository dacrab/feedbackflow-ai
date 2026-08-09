import "server-only";

import { Eyebrow, MetricCard, PageHeader } from "@/components/ui/ui";
import { requireAuth } from "@/lib/api";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import { getDashboard } from "@/lib/services/dashboard-service";
import {
  DynamicSentimentChart,
  DynamicSeverityChart,
  DynamicTopicsChart,
  DynamicTrendChart,
} from "./charts";

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
    <div className="rounded border border-border bg-card p-4 min-w-0 overflow-hidden">
      <Eyebrow className="mb-3">{label}</Eyebrow>
      <div className="h-48 w-full min-w-0">{children}</div>
      {footer}
    </div>
  );
}

export default async function DashboardPage() {
  const userId = await requireAuth();
  const m = await getDashboard(userId);

  const trendData = m.trendLabels.map((label, i) => ({
    name: label.slice(5),
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
        <MetricCard label="total" value={m.total} delta={m.trendDelta} />
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
          <DynamicTrendChart data={trendData} />
        </ChartCard>
        <ChartCard
          label="sentiment"
          footer={
            <div className="flex justify-center gap-4 mt-2 text-xs">
              {sentimentData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
              ))}
            </div>
          }
        >
          <DynamicSentimentChart data={sentimentData} />
        </ChartCard>
        <ChartCard label="topics">
          <DynamicTopicsChart data={m.topTopics} />
        </ChartCard>
        <ChartCard label="severity distribution">
          <DynamicSeverityChart data={severityData} />
        </ChartCard>
      </div>
    </div>
  );
}
