import { SentimentChart, SeverityChart, TopicsChart, TrendChart } from "@/components/charts";
import { getServerSession } from "@/lib/api";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import { getDashboard } from "@/lib/dashboard";

function MetricCard({
  label,
  value,
  delta,
  note,
}: {
  label: string;
  value: string | number;
  delta?: number;
  note?: string;
}) {
  return (
    <div className="rounded border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-medium">{value}</p>
      {delta !== undefined && (
        <p className="text-xs mt-1">
          <span className={delta >= 0 ? "text-green-500" : "text-red-500"}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
          <span className="text-muted-foreground"> vs last period</span>
        </p>
      )}
      {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

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
      <p className="text-sm text-muted-foreground mb-3">// {label}</p>
      <div className="h-52 w-full min-w-0">{children}</div>
      {footer}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession();
  const m = await getDashboard(session?.user?.id as string);

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
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">// overview</p>
        <h1 className="text-xl font-medium">dashboard</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="total" value={m.total} delta={m.trendDelta} />
        <MetricCard label="positive" value={`${m.positiveShare}%`} />
        <MetricCard
          label="critical"
          value={m.highSeverity}
          note={`severity ${HIGH_SEVERITY_THRESHOLD}+`}
        />
        <MetricCard label="avg severity" value={m.avgSeverity} note={`of ${MAX_SEVERITY}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard label="trend">
          <TrendChart data={trendData} />
        </ChartCard>
        <ChartCard
          label="sentiment"
          footer={
            <div className="flex justify-center gap-4 mt-3 text-xs">
              {sentimentData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
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
