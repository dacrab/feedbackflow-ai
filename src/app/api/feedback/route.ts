import { createAdminClient } from "@/lib/supabase/admin";
import { errorResponse, requireAuth, successResponse } from "@/lib/utils/api";

type AnalysisRow = {
  sentiment: string;
  topics: string[];
  severity_score: number;
  summary: string;
  status: string;
};
type ItemRow = {
  raw_content: string;
  feedback_analyses: AnalysisRow[] | AnalysisRow | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = await requireAuth();

    const admin = createAdminClient();

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const offset = (page - 1) * limit;

    const { data, error } = await admin
      .from("feedback_items")
      .select(
        `id, source, raw_content, original_timestamp, created_at, feedback_analyses ( sentiment, topics, severity_score, summary, status )`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return errorResponse(error.message, 500);

    const sentiment = searchParams.get("sentiment");
    const topic = searchParams.get("topic");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.toLowerCase();
    const sMin = parseInt(searchParams.get("severity_min") || "1", 10);
    const sMax = parseInt(searchParams.get("severity_max") || "5", 10);

    const filtered = (data || []).filter((row: ItemRow) => {
      const a = Array.isArray(row.feedback_analyses)
        ? row.feedback_analyses[0]
        : row.feedback_analyses;
      if (!a) return false;
      if (sentiment && a.sentiment !== sentiment) return false;
      if (status && a.status !== status) return false;
      if (Number.isFinite(sMin) && a.severity_score < sMin) return false;
      if (Number.isFinite(sMax) && a.severity_score > sMax) return false;
      if (topic && Array.isArray(a.topics) && !a.topics.includes(topic)) return false;
      if (q) {
        const hay = `${row.raw_content}\n${a.summary || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return successResponse({ page, limit, items: filtered });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(String(error), 500);
  }
}
