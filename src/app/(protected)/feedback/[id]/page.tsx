import { createAdminClient } from "@/lib/supabase/admin";
import { createRSCClient } from "@/lib/supabase/server";
import StatusChanger from "./status-changer";

type AnalysisRow = {
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
  severity_score: number;
  summary: string;
  status: "New" | "Acknowledged" | "Actioned";
};

type ItemRow = {
  id: string;
  source: string;
  raw_content: string;
  original_timestamp: string;
  created_at: string;
  feedback_analyses: AnalysisRow[] | AnalysisRow | null;
};

async function getItem(userId: string, id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback_items")
    .select(
      `id, source, raw_content, original_timestamp, created_at, feedback_analyses ( sentiment, topics, severity_score, summary, status )`,
    )
    .eq("user_id", userId)
    .eq("id", id)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ItemRow;
}

export default async function FeedbackDetail({ params }: { params: { id: string } }) {
  const supa = await createRSCClient();
  const { data } = await supa.auth.getUser();
  if (!data.user) throw new Error("unauthorized");
  const row = await getItem(data.user.id, params.id);
  const a = Array.isArray(row.feedback_analyses) ? row.feedback_analyses[0] : row.feedback_analyses;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Raw Feedback</h1>
        <pre className="whitespace-pre-wrap border rounded p-4 text-sm">{row.raw_content}</pre>
      </div>
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">AI Analysis</h2>
        <div className="border rounded p-4 space-y-2 text-sm">
          <div>
            <span className="font-medium">Summary:</span> {a?.summary}
          </div>
          <div>
            <span className="font-medium">Sentiment:</span> {a?.sentiment}
          </div>
          <div>
            <span className="font-medium">Severity:</span> {a?.severity_score}
          </div>
          <div>
            <span className="font-medium">Topics:</span>{" "}
            {Array.isArray(a?.topics) ? a.topics.join(", ") : ""}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>{" "}
            <StatusChanger id={row.id} initial={a?.status || "New"} />
          </div>
        </div>
      </div>
    </div>
  );
}
