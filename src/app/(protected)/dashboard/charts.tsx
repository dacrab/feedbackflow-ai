"use client";

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

const axisTick = { fontSize: 12 };

export function TrendChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={30} />
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
          fill="url(#tg)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SentimentChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((e) => (
            <Cell key={e.name} fill={e.color} />
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
  );
}

export function TopicsChart({ data }: { data: { topic: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
        <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="topic"
          tick={axisTick}
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
  );
}

export function SeverityChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={30} />
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
  );
}
