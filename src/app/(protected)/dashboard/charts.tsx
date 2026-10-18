"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisTick = { fontSize: 12 };
const axisProps = { tick: axisTick, tickLine: false, axisLine: false };

const TOOLTIP_CONTENT_STYLE = {
  background: "var(--color-background)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "13px",
};

interface Datum {
  name: string;
  value: number;
}

export function TrendChart({ data }: { data: Datum[] }) {
  // Per-instance, so two trend charts cannot share (and fight over) one gradient.
  const gradientId = useId();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} width={30} />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SentimentChart({ data }: { data: (Datum & { color: string })[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data.map((e) => ({ ...e, fill: e.color }))}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopicsChart({ data }: { data: { topic: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
        <XAxis type="number" {...axisProps} />
        <YAxis type="category" dataKey="topic" {...axisProps} width={100} />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
        <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SeverityChart({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} width={30} />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
        <Bar dataKey="value" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
