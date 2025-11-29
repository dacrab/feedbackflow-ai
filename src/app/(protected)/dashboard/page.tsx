import { AlertTriangle, ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { auth } from "@/auth";
import { computeMetrics } from "@/lib/dashboard";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect("/login");

  const data = await getDashboardData(userId);
  const metrics = computeMetrics(data);

  const trendData = metrics.trendLabels.map((label, i) => ({
    name: label.slice(5),
    value: metrics.trendValues[i] ?? 0,
  }));

  const sentimentData = [
    { name: "Positive", value: metrics.positive, color: "var(--color-chart-4)" },
    { name: "Neutral", value: metrics.neutral, color: "var(--color-muted-foreground)" },
    { name: "Negative", value: metrics.negative, color: "var(--color-chart-5)" },
  ];

  const topicData = metrics.topTopics.slice(0, 5);
  const severityData = [1, 2, 3, 4, 5].map((s) => ({
    name: String(s),
    value: data.severityHist[s] || 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your feedback analytics</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Feedback"
          value={metrics.total}
          change={metrics.trendDelta}
          changeLabel="vs last period"
        />
        <MetricCard
          title="Positive Rate"
          value={`${metrics.positiveShare}%`}
          icon={TrendingUp}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Critical Issues"
          value={metrics.highSeverity}
          icon={AlertTriangle}
          iconColor="text-orange-500"
          subtitle="Severity 4-5"
        />
        <MetricCard title="Avg Severity" value={metrics.avgSeverity} subtitle="Scale 1-5" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-medium mb-4">Feedback Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#gradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-medium mb-4">Sentiment Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sentimentData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topics Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-medium mb-4">Top Topics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="topic"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-medium mb-4">Severity Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  subtitle,
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        {Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {change !== undefined && (
        <p className="mt-1 flex items-center gap-1 text-sm">
          {change >= 0 ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={change >= 0 ? "text-green-600" : "text-red-500"}>
            {change >= 0 ? "+" : ""}
            {change}
          </span>
          {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
        </p>
      )}
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
