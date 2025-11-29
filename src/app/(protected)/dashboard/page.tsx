import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  MessageSquare,
  TrendingUp,
  Zap,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeMetrics } from "@/lib/dashboard";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  const data = await getDashboardData(userId);
  const metrics = computeMetrics(data);

  // Transform data for charts
  const trendData = metrics.trendLabels.map((label, i) => ({
    name: label,
    value: metrics.trendValues[i] ?? 0,
  }));

  const sentimentData = [
    { name: "Positive", value: metrics.positive },
    { name: "Neutral", value: metrics.neutral },
    { name: "Negative", value: metrics.negative },
  ];

  const topicData = metrics.topTopics.map((t) => ({
    name: t.topic,
    value: t.value,
  }));

  const severityData = [1, 2, 3, 4, 5].map((s) => ({
    name: String(s),
    value: data.severityHist[s] || 0,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back, here's what's happening with your product.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-background/50 border border-border/40 text-xs font-medium flex items-center shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Updates
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors group cursor-default relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-16 h-16 -rotate-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span
                className={
                  metrics.trendDelta >= 0
                    ? "text-emerald-500 flex items-center"
                    : "text-rose-500 flex items-center"
                }
              >
                {metrics.trendDelta >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingUp className="h-3 w-3 mr-0.5 rotate-180" />
                )}
                {metrics.trendDeltaLabel}
              </span>
              <span>vs last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors group cursor-default relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-16 h-16 -rotate-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Positive Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.positiveShare}%</div>
            <div className="w-full bg-muted/50 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${metrics.positiveShare}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors group cursor-default relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 -rotate-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.highSeverity}</div>
            <p className="text-xs text-muted-foreground mt-1">Items with severity ≥ 4</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors group cursor-default relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 -rotate-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.avgSeverity}</div>
            <p className="text-xs text-muted-foreground mt-1">Weighted score (1-5)</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="rounded-xl">
        <OverviewCharts
          trendData={trendData}
          sentimentData={sentimentData}
          topicData={topicData}
          severityData={severityData}
        />
      </div>
    </div>
  );
}
