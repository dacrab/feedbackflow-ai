import {
  filterFeedbackItems,
  parseFeedbackFilters,
  parsePagination,
} from "@/lib/services/query-builder";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackItem, PaginatedResponse } from "@/lib/types";
import { successResponse } from "@/lib/utils/api";
import { withAuthRequest } from "@/lib/utils/route-handler";

export const GET = withAuthRequest(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const admin = createAdminClient();

  const { page, limit, offset } = parsePagination(searchParams);
  const filters = parseFeedbackFilters(searchParams);

  const { data, error } = await admin
    .from("feedback_items")
    .select(
      `id, source, raw_content, original_timestamp, created_at, feedback_analyses ( sentiment, topics, severity_score, summary, status )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const filtered = filterFeedbackItems((data || []) as FeedbackItem[], filters);

  const response: PaginatedResponse<FeedbackItem> = {
    page,
    limit,
    items: filtered,
  };

  return successResponse(response);
});
