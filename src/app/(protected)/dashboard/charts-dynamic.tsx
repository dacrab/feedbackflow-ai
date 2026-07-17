"use client";

import dynamic from "next/dynamic";

export const TrendChart = dynamic(() => import("./charts").then((m) => m.TrendChart), {
  ssr: false,
});
export const SentimentChart = dynamic(() => import("./charts").then((m) => m.SentimentChart), {
  ssr: false,
});
export const TopicsChart = dynamic(() => import("./charts").then((m) => m.TopicsChart), {
  ssr: false,
});
export const SeverityChart = dynamic(() => import("./charts").then((m) => m.SeverityChart), {
  ssr: false,
});
