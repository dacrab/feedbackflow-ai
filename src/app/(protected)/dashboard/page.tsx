import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";
import { getServerSession } from "@/lib/api";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import { SentimentChart, SeverityChart, TopicsChart, TrendChart } from "./charts";

interface ComputedMetrics {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positiveShare: number;
  highSeverity: number;
  avgSeverity: string;
  trendLabels: Array<string>;
  trendValues: Array<number>;
  trendDelta: number;
  topTopics: Array<{ topic: string; value: number }>;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type TrendRow = { day: string; cnt: string; delta: string };
type SummaryRow = {
  sentiment: string | null;
  cnt: number;
  highCnt: number;
  avgSev: string;
  positiveShare: number;
};
type SeverityRow = { score: number; cnt: number };
type TopicRow = { topic: string; cnt: string };

function aggregateSummary(rows: SummaryRow[]) {
  let total = 0;
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let highSeverity = 0;
  let totalWeightedAvg = 0;

  for (const r of rows) {
    const c = Number(r.cnt);
    total += c;
    highSeverity += Number(r.highCnt);
    totalWeightedAvg += Number(r.avgSev) * c;
    if (r.sentiment === "positive") positive = c;
    else if (r.sentiment === "neutral") neutral = c;
    else if (r.sentiment === "negative") negative = c;
  }

  const positiveShare = total > 0 ? Math.round((positive / total) * 100) : 0;
  const avgSeverity = total > 0 ? (totalWeightedAvg / total).toFixed(1) : "0.0";

  return { total, positive, neutral, negative, highSeverity, avgSeverity, positiveShare };
}

function buildSeverityHist(rows: SeverityRow[]): Record<number, number> {
  const hist: Record<number, number> = {};
  for (let i = 1; i <= MAX_SEVERITY; i++) hist[i] = 0;
  for (const r of rows) hist[r.score] = Number(r.cnt);
  return hist;
}

const getDashboard = cache(
  async (userId: string): Promise<ComputedMetrics & { severityHist: Record<number, number> }> => {
    const since = new Date(Date.now() - THIRTY_DAYS_MS);
    const base = and(eq(feedbackItems.userId, userId), gte(feedbackItems.createdAt, since));

    const [summaryRows, severityRows, trendRows, topicRows] = await Promise.all([
      db
        .select({
          sentiment: feedbackAnalyses.sentiment,
          cnt: sql<number>`COUNT(*)`,
          highCnt: sql<number>`COUNT(*) FILTER (WHERE ${feedbackAnalyses.severityScore} >= ${HIGH_SEVERITY_THRESHOLD})`,
          avgSev: sql<string>`ROUND(AVG(${feedbackAnalyses.severityScore})::numeric, 1)`,
          positiveShare: sql<number>`ROUND(100.0 * COUNT(*) FILTER (WHERE ${feedbackAnalyses.sentiment} = 'positive') / NULLIF(COUNT(*), 0))`,
        })
        .from(feedbackItems)
        .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
        .where(base)
        .groupBy(feedbackAnalyses.sentiment),

      db
        .select({
          score: feedbackAnalyses.severityScore,
          cnt: sql<number>`COUNT(*)`,
        })
        .from(feedbackItems)
        .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
        .where(base)
        .groupBy(feedbackAnalyses.severityScore),

      db.execute(sql`
        SELECT
          DATE(fi.created_at) AS day,
          COUNT(*) AS cnt,
          COUNT(*) - LAG(COUNT(*), 1, COUNT(*)) OVER (ORDER BY DATE(fi.created_at)) AS delta
        FROM feedback_items fi
        INNER JOIN feedback_analyses fa ON fa.feedback_item_id = fi.id
        WHERE fi.user_id = ${userId}
          AND fi.created_at >= ${since}
        GROUP BY DATE(fi.created_at)
        ORDER BY DATE(fi.created_at)
      `),

      db.execute(sql`
        SELECT t.topic, COUNT(*) AS cnt
        FROM feedback_items fi
        INNER JOIN feedback_analyses fa ON fa.feedback_item_id = fi.id
        CROSS JOIN LATERAL jsonb_array_elements_text(fa.topics) AS t(topic)
        WHERE fi.user_id = ${userId}
          AND fi.created_at >= ${since}
        GROUP BY t.topic
        ORDER BY cnt DESC
        LIMIT 10
      `),
    ]);

    const { total, positive, neutral, negative, highSeverity, avgSeverity, positiveShare } =
      aggregateSummary(summaryRows);

    const severityHist = buildSeverityHist(severityRows);

    const trendData = trendRows.rows as TrendRow[];
    const topTopics = (topicRows.rows as TopicRow[]).map((r) => ({
      topic: r.topic,
      value: Number(r.cnt),
    }));

    return {
      total,
      positive,
      neutral,
      negative,
      positiveShare,
      highSeverity,
      avgSeverity,
      trendLabels: trendData.map((r) => r.day),
      trendValues: trendData.map((r) => Number(r.cnt)),
      trendDelta: Number(trendData.at(-1)?.delta ?? 0),
      topTopics,
      severityHist,
    };
  },
);

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
    <div className="rounded border border-border bg-card px-4 py-3 space-y-1">
      <p className="text-xs text-muted-foreground">// {label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-medium leading-none">{value}</p>
        {delta !== undefined && (
          <span
            className={`text-xs font-mono mb-0.5 ${delta >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {delta >= 0 ? "↑" : "↓"}
            {Math.abs(delta)}
          </span>
        )}
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
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
      <p className="text-xs text-muted-foreground mb-3">// {label}</p>
      <div className="h-48 w-full min-w-0">{children}</div>
      {footer}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession();
  const userId = session?.user?.id;
  if (!userId) return null;
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
      <div>
        <p className="text-xs text-muted-foreground">// overview</p>
        <h1 className="text-xl font-medium">dashboard</h1>
      </div>

      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 stagger-children">
        <MetricCard label="total" value={m.total} delta={m.trendDelta} />
        <MetricCard label="positive" value={`${m.positiveShare}%`} />
        <MetricCard
          label="critical"
          value={m.highSeverity}
          note={`severity ${HIGH_SEVERITY_THRESHOLD}+`}
        />
        <MetricCard label="avg severity" value={m.avgSeverity} note={`of ${MAX_SEVERITY}`} />
      </div>

      <div className="grid gap-2 lg:grid-cols-2 stagger-children">
        <ChartCard label="trend">
          <TrendChart data={trendData} />
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
