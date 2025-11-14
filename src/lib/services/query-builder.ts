/**
 * Reusable query and filtering utilities for feedback lists
 */

import type { FeedbackFilterParams, FeedbackItem } from "@/lib/types";

interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Parse and validate pagination parameters
 */
export function parsePagination(searchParams: URLSearchParams): PaginationResult {
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Parse feedback filter parameters from URL search params
 */
export function parseFeedbackFilters(searchParams: URLSearchParams): FeedbackFilterParams {
  const sentiment = searchParams.get("sentiment") as "positive" | "neutral" | "negative" | null;
  const topic = searchParams.get("topic");
  const status = searchParams.get("status") as "New" | "Acknowledged" | "Actioned" | null;
  const q = searchParams.get("q");

  return {
    ...(sentiment ? { sentiment } : {}),
    ...(topic ? { topic } : {}),
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
    severity_min: parseInt(searchParams.get("severity_min") || "1", 10),
    severity_max: parseInt(searchParams.get("severity_max") || "5", 10),
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "20", 10),
  };
}

/**
 * Filter feedback items based on filter parameters
 */
export function filterFeedbackItems(
  items: FeedbackItem[],
  filters: FeedbackFilterParams,
): FeedbackItem[] {
  return items.filter((row) => {
    const analysis = Array.isArray(row.feedback_analyses)
      ? row.feedback_analyses[0]
      : row.feedback_analyses;

    if (!analysis) return false;

    if (filters.sentiment && analysis.sentiment !== filters.sentiment) return false;
    if (filters.status && analysis.status !== filters.status) return false;
    if (filters.severity_min && analysis.severity_score < filters.severity_min) return false;
    if (filters.severity_max && analysis.severity_score > filters.severity_max) return false;
    if (filters.topic && Array.isArray(analysis.topics) && !analysis.topics.includes(filters.topic))
      return false;

    if (filters.q) {
      const searchText = `${row.raw_content}\n${analysis.summary || ""}`.toLowerCase();
      if (!searchText.includes(filters.q.toLowerCase())) return false;
    }

    return true;
  });
}
