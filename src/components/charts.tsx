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

const tooltip = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "12px",
};
const axis = { fontSize: 12 };
const RC = ({ children }: { children: React.ReactNode }) => (
  <ResponsiveContainer width="100%" height="100%">
    {children}
  </ResponsiveContainer>
);

export function TrendChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <RC>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={30} />
        <Tooltip contentStyle={tooltip} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#tg)"
        />
      </AreaChart>
    </RC>
  );
}

export function SentimentChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <RC>
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
        <Tooltip contentStyle={tooltip} />
      </PieChart>
    </RC>
  );
}

export function TopicsChart({ data }: { data: { topic: string; value: number }[] }) {
  return (
    <RC>
      <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
        <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="topic"
          tick={axis}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip contentStyle={tooltip} />
        <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </RC>
  );
}

export function SeverityChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <RC>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={30} />
        <Tooltip contentStyle={tooltip} />
        <Bar dataKey="value" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </RC>
  );
}
