import { requireAuth } from "@/lib/api";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackItems } from "@/lib/services/feedback-service";
import type { FeedbackStatus, Sentiment } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { id: userId } = await requireAuth();

  const url = new URL(req.url);
  const sentiment = (url.searchParams.get("sentiment") as Sentiment) || undefined;
  const status = (url.searchParams.get("status") as FeedbackStatus) || undefined;
  const topic = url.searchParams.get("topic") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const severityMin = Number.parseInt(url.searchParams.get("severity_min") ?? "1", 10);
  const severityMax = Number.parseInt(
    url.searchParams.get("severity_max") ?? String(MAX_SEVERITY),
    10,
  );

  const items = await getFeedbackItems(userId, {
    limit: 10000,
    offset: 0,
    filters: {
      ...(sentiment && { sentiment }),
      ...(status && { status }),
      ...(topic && { topic }),
      ...(q && { q }),
      severityMin,
      severityMax,
    },
  });

  const headers = [
    "id",
    "title",
    "source",
    "sentiment",
    "severity",
    "status",
    "topic",
    "created_at",
    "summary",
  ];
  const csvEscape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = items.map((item) => {
    const a = item.feedback_analyses;
    return [
      item.id,
      csvEscape(a?.summary || ""),
      item.source,
      a?.sentiment || "",
      String(a?.severity_score ?? ""),
      a?.status || "",
      a?.topics?.[0] || "",
      item.created_at,
      csvEscape(a?.summary || ""),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=feedback-export.csv",
    },
  });
}
