import { getFeedbackItems } from "@/lib/services/feedback-service";
import {
  filterFeedbackItems,
  parseFeedbackFilters,
  parsePagination,
} from "@/lib/services/query-builder";
import type { FeedbackItem, PaginatedResponse } from "@/lib/types";
import { successResponse } from "@/lib/utils/api";
import { withAuthRequest } from "@/lib/utils/route-handler";

export const GET = withAuthRequest(async (req, user) => {
  const { searchParams } = new URL(req.url);

  const { page, limit, offset } = parsePagination(searchParams);
  const filters = parseFeedbackFilters(searchParams);

  const items = await getFeedbackItems(user.id, { limit, offset });
  const filtered = filterFeedbackItems(items, filters);

  const response: PaginatedResponse<FeedbackItem> = {
    page,
    limit,
    items: filtered,
  };

  return successResponse(response);
});
