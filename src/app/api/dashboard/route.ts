import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function GET() {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback_analyses")
    .select("sentiment, topics, severity_score, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const countsBySentiment: Record<string, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  const topicCounts: Record<string, number> = {};
  const severityHist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const trendByDay: Record<string, number> = {};

  for (const row of data || []) {
    countsBySentiment[row.sentiment] = (countsBySentiment[row.sentiment] || 0) + 1;
    if (Array.isArray(row.topics)) {
      for (const t of row.topics) topicCounts[t] = (topicCounts[t] || 0) + 1;
    }
    severityHist[row.severity_score as 1 | 2 | 3 | 4 | 5] =
      (severityHist[row.severity_score as 1 | 2 | 3 | 4 | 5] || 0) + 1;
    const day = new Date(row.created_at as string).toISOString().slice(0, 10);
    trendByDay[day] = (trendByDay[day] || 0) + 1;
  }

  return NextResponse.json({
    countsBySentiment,
    topicCounts,
    severityHist,
    trendByDay,
  });
}
