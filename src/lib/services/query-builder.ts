import { MAX_SEVERITY, MIN_SEVERITY } from "@/lib/constants";
import type { FeedbackFilterParams, FeedbackItem, Sentiment } from "@/lib/types";

export function parseFeedbackFilters(searchParams: URLSearchParams): FeedbackFilterParams {
  return {
    sentiment: (searchParams.get("sentiment") as Sentiment) || undefined,
    topic: searchParams.get("topic") || undefined,
    status: (searchParams.get("status") as "New" | "Acknowledged" | "Actioned") || undefined,
    q: searchParams.get("q") || undefined,
    severity_min: Number.parseInt(searchParams.get("severity_min") || String(MIN_SEVERITY), 10),
    severity_max: Number.parseInt(searchParams.get("severity_max") || String(MAX_SEVERITY), 10),
  };
}

export function filterFeedbackItems(
  items: Array<FeedbackItem>,
  filters: FeedbackFilterParams,
): Array<FeedbackItem> {
  return items.filter((item) => {
    const analysis = item.feedback_analyses;
    if (filters.sentiment && analysis?.sentiment !== filters.sentiment) return false;
    if (filters.status && analysis?.status !== filters.status) return false;
    if (filters.topic && !analysis?.topics?.includes(filters.topic)) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (
        !item.raw_content.toLowerCase().includes(q) &&
        !analysis?.summary?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.severity_min && (analysis?.severity_score ?? 0) < filters.severity_min)
      return false;
    if (filters.severity_max && (analysis?.severity_score ?? MAX_SEVERITY) > filters.severity_max)
      return false;
    return true;
  });
}
