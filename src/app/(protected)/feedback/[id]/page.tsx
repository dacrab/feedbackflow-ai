import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
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

  function sentimentBadge(sentiment?: string | null) {
    if (!sentiment) return null;
    const styles: Record<string, string> = {
      positive: "bg-[rgba(34,197,94,0.16)] text-emerald-600 border-transparent",
      neutral: "bg-[rgba(148,163,184,0.14)] text-slate-600 border-transparent",
      negative: "bg-[rgba(239,68,68,0.16)] text-rose-600 border-transparent",
    };
    return <span className={cn("badge capitalize", styles[sentiment] ?? "")}>{sentiment}</span>;
  }

  const topics = Array.isArray(a?.topics) ? a.topics : [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="border-border/60">
          <CardHeader className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle className="text-xs">Feedback summary</CardTitle>
              <h1 className="text-xl font-semibold text-foreground">{a?.summary || "Untitled feedback"}</h1>
              <div className="flex flex-wrap gap-2">
                {sentimentBadge(a?.sentiment)}
                <span className="badge bg-[rgba(37,99,235,0.12)] text-foreground">
                  Severity {a?.severity_score ?? "—"}
                </span>
                <StatusChanger id={row.id} initial={a?.status || "New"} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] px-4 py-3 text-xs">
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="font-semibold text-foreground">Source</span>
                  <p>{row.source}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Original timestamp</span>
                  <p>{row.original_timestamp || "—"}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Stored</span>
                  <p>{new Date(row.created_at).toUTCString()}</p>
                </div>
              </div>
            </div>
            {topics.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <span
                      key={topic}
                      className="badge bg-[rgba(148,163,184,0.12)] text-slate-600 border-transparent"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)]">
          <CardHeader className="mb-2">
            <CardTitle className="text-xs">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Share severity ≥ 4 items with your incident response channel via Slack or webhooks.</p>
            <p>Assign owners by updating the triage status. “Actioned” keeps teams aligned on delivery.</p>
            <p>Need more context? Jump into the raw transcript or original source link below.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="mb-2">
            <CardTitle className="text-xs">Raw feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_95%,transparent)] p-5 text-sm leading-relaxed text-foreground/90">
              {row.raw_content}
            </pre>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="mb-2">
            <CardTitle className="text-xs">AI breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Summary</p>
              <p className="mt-2 text-foreground">{a?.summary || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Sentiment</p>
              <div className="mt-2">{sentimentBadge(a?.sentiment)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Severity score</p>
              <div className="mt-2">
                <span className="badge bg-[rgba(37,99,235,0.12)] text-foreground">{a?.severity_score ?? "—"}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Status</p>
              <div className="mt-2">
                <StatusChanger id={row.id} initial={a?.status || "New"} compact />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
