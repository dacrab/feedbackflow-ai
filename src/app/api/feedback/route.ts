import { getFeedbackItems } from "@/lib/services/feedback-service";
import { filterFeedbackItems, parseFeedbackFilters } from "@/lib/services/query-builder";
import { successResponse, withAuthRequest } from "@/lib/utils";

export const GET = withAuthRequest(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const filters = parseFeedbackFilters(searchParams);
  const items = await getFeedbackItems(user.id, { limit: 100 });
  return successResponse(filterFeedbackItems(items, filters));
});
