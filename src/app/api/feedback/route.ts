import { successResponse, withAuthRequest } from "@/lib/api";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackItems } from "@/lib/services/feedback-service";

export const GET = withAuthRequest(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const allItems = await getFeedbackItems(user.id, { limit: 100 });

  // Inline filtering
  const sentiment = searchParams.get("sentiment");
  const status = searchParams.get("status");
  const topic = searchParams.get("topic");
  const q = searchParams.get("q");
  const severityMin = Number.parseInt(searchParams.get("severity_min") || "1", 10);
  const severityMax = Number.parseInt(searchParams.get("severity_max") || String(MAX_SEVERITY), 10);

  const items = allItems.filter((item) => {
    const analysis = item.feedback_analyses;
    if (sentiment && analysis?.sentiment !== sentiment) return false;
    if (status && analysis?.status !== status) return false;
    if (topic && !analysis?.topics?.includes(topic)) return false;
    if (q) {
      const query = q.toLowerCase();
      if (
        !item.raw_content.toLowerCase().includes(query) &&
        !analysis?.summary?.toLowerCase().includes(query)
      )
        return false;
    }
    if ((analysis?.severity_score ?? 0) < severityMin) return false;
    if ((analysis?.severity_score ?? MAX_SEVERITY) > severityMax) return false;
    return true;
  });

  return successResponse(items);
});
