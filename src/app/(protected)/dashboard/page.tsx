"use client";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardData = {
  countsBySentiment: Record<string, number>;
  topicCounts: Record<string, number>;
  severityHist: Record<string, number>;
  trendByDay: Record<string, number>;
};

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        setData(await res.json());
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    })();
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return <div>Loading…</div>;

  const sentiments = data.countsBySentiment;
  const topicCounts = data.topicCounts;
  const severityHist = data.severityHist;
  const trendByDay = data.trendByDay as Record<string, number>;

  const sentimentData = {
    labels: Object.keys(sentiments),
    datasets: [
      {
        data: Object.values(sentiments),
        backgroundColor: ["#1f2937", "#6b7280", "#d1d5db"],
      },
    ],
  };
  const topicData = {
    labels: Object.keys(topicCounts),
    datasets: [{ data: Object.values(topicCounts), backgroundColor: "#374151" }],
  };
  const severityData = {
    labels: Object.keys(severityHist),
    datasets: [{ data: Object.values(severityHist), backgroundColor: "#6b7280" }],
  };
  const trendLabels = Object.keys(trendByDay).sort();
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        data: trendLabels.map((d) => trendByDay[d]),
        backgroundColor: "#9ca3af",
      },
    ],
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment split</CardTitle>
          </CardHeader>
          <CardContent>
            <Pie data={sentimentData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={topicData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={severityData} />
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Ingested items trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={trendData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
