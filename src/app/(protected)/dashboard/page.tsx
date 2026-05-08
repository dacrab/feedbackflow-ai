import { redirect } from "next/navigation";
import { SentimentChart, SeverityChart, TopicsChart, TrendChart } from "@/components/charts";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import { getDashboard } from "@/lib/dashboard";
import { getServerSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const metrics = await getDashboard(userId);

  const trendData = metrics.trendLabels.map((label, i) => ({
    name: label.slice(5),
    value: metrics.trendValues[i] ?? 0,
  }));

  const sentimentData = [
    { name: "positive", value: metrics.positive, color: "var(--color-chart-4)" },
    { name: "neutral", value: metrics.neutral, color: "var(--color-muted-foreground)" },
    { name: "negative", value: metrics.negative, color: "var(--color-chart-5)" },
  ];

  const topicData = metrics.topTopics;

  const severityData = Array.from({ length: MAX_SEVERITY }, (_, i) => ({
    name: String(i + 1),
    value: metrics.severityHist[i + 1] || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">// overview</p>
        <h1 className="text-xl font-medium">dashboard</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="total" value={metrics.total} delta={metrics.trendDelta} />
        <MetricCard label="positive" value={`${metrics.positiveShare}%`} />
        <MetricCard
          label="critical"
          value={metrics.highSeverity}
          note={`severity ${HIGH_SEVERITY_THRESHOLD}+`}
        />
        <MetricCard label="avg severity" value={metrics.avgSeverity} note={`of ${MAX_SEVERITY}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">// trend</p>
          <div className="h-52">
            <TrendChart data={trendData} />
          </div>
        </div>

        <div className="rounded border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">// sentiment</p>
          <div className="h-52">
            <SentimentChart data={sentimentData} />
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">// topics</p>
          <div className="h-52">
            <TopicsChart data={topicData} />
          </div>
        </div>

        <div className="rounded border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">// severity distribution</p>
          <div className="h-52">
            <SeverityChart data={severityData} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
