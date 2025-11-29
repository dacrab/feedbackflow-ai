"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewChartsProps {
  trendData: { name: string; value: number }[];
  sentimentData: { name: string; value: number }[];
  topicData: { name: string; value: number }[];
  severityData: { name: string; value: number }[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-background/80 backdrop-blur-md p-3 shadow-xl">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground">{payload[0]?.value}</p>
      </div>
    );
  }
  return null;
}

export function OverviewCharts({
  trendData,
  sentimentData,
  topicData,
  severityData,
}: OverviewChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      {/* Trend Chart */}
      <Card className="col-span-4 border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Daily Intake Trend</CardTitle>
          <CardDescription>Volume of feedback processed over time.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  tickMargin={10}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTrend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Chart */}
      <Card className="col-span-3 border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>Breakdown of feedback sentiment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {sentimentData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === "Positive"
                          ? "var(--chart-4)"
                          : entry.name === "Negative"
                            ? "var(--destructive)"
                            : "var(--muted-foreground)"
                      }
                      className="stroke-background stroke-2"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold">
                {sentimentData.reduce((acc, curr) => acc + curr.value, 0)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                Total
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--chart-4)]" />
              Positive
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              Neutral
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              Negative
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Topics */}
      <Card className="col-span-4 border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Top Topics</CardTitle>
          <CardDescription>Most frequent themes in your feedback.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topicData.slice(0, 5)}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                barCategoryGap={20}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                  opacity={0.4}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)/0.2" }} />
                <Bar
                  dataKey="value"
                  fill="var(--chart-2)"
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                  background={{ fill: "var(--muted)/0.2" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Severity */}
      <Card className="col-span-3 border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Severity Scores</CardTitle>
          <CardDescription>Distribution of urgency levels (1-5).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} barCategoryGap={30}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)/0.2" }} />
                <Bar
                  dataKey="value"
                  fill="var(--chart-3)"
                  radius={[6, 6, 0, 0]}
                  background={{ fill: "var(--muted)/0.2" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
