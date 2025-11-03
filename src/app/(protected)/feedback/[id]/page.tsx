import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRSCClient } from "@/lib/supabase/server";
import type { FeedbackItem } from "@/lib/types";
import { formatDateUTC } from "@/lib/utils/date";
import { SentimentBadge } from "@/lib/utils/sentiment";
import StatusChanger from "./status-changer";

async function getItem(userId: string, id: string): Promise<FeedbackItem> {
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
  return data as FeedbackItem;
}

export default async function FeedbackDetail({ params }: { params: { id: string } }) {
  const supa = await createRSCClient();
  const { data } = await supa.auth.getUser();
  if (!data.user) throw new Error("unauthorized");

  const row = await getItem(data.user.id, params.id);
  const analysis = Array.isArray(row.feedback_analyses)
    ? row.feedback_analyses[0]
    : row.feedback_analyses;
  const topics = Array.isArray(analysis?.topics) ? analysis.topics : [];
  const storedAt = formatDateUTC(row.created_at);
  const originalAt = row.original_timestamp ? formatDateUTC(row.original_timestamp) : "—";

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="border border-border/60 bg-background/85">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <SentimentBadge sentiment={analysis?.sentiment} />
                <span className="badge bg-[color-mix(in_oklab,var(--accent)_24%,transparent)] text-foreground">
                  Severity {analysis?.severity_score ?? "—"}
                </span>
                <StatusChanger id={row.id} initial={analysis?.status || "New"} />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Feedback summary</p>
                <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
                  {analysis?.summary || "Untitled feedback summary"}
                </h1>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Source</p>
                <p className="mt-2 text-foreground">{row.source}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Original timestamp
                </p>
                <p className="mt-2 text-foreground" suppressHydrationWarning>
                  {originalAt}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Captured</p>
                <p className="mt-2 text-foreground" suppressHydrationWarning>
                  {storedAt}
                </p>
              </div>
            </div>

            {topics.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Topics identified
                </p>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <span
                      key={topic}
                      className="badge bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-foreground/90 border-transparent"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-xs text-muted-foreground">
                No topics were extracted. Consider refining your ingest sources for richer context.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-4">
          <Card className="border border-border/60 bg-background/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Next best actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                • Confirm ownership for this feedback item in the inbox, then set the status to{" "}
                <strong>Actioned</strong> once resolved.
              </p>
              <p>
                • Add a note in your triage log if this sentiment recurs. High severity issues
                generate alerts via Slack when notifications are configured.
              </p>
              <p>
                • Share a one-line update with product and success teams using the summary above.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-background/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Need full history?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Jump back to the inbox to review adjacent items captured during the same ingest
                window.
              </p>
              <Link
                href="/inbox"
                className="text-sm font-medium text-foreground underline decoration-dotted underline-offset-4"
              >
                Open inbox timeline
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Raw customer voice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-border/60 bg-background/70 p-5 text-sm leading-relaxed text-foreground/90">
              {row.raw_content || "No raw content available."}
            </pre>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">AI analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Summary</p>
              <p className="mt-2 text-foreground">{analysis?.summary || "No summary available."}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Sentiment</p>
              <div className="mt-2">
                {analysis?.sentiment ? (
                  <SentimentBadge sentiment={analysis.sentiment} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Severity score
              </p>
              <div className="mt-2">
                <span className="badge bg-[color-mix(in_oklab,var(--accent)_22%,transparent)] text-foreground">
                  {analysis?.severity_score ?? "—"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
              <div className="mt-2">
                <StatusChanger id={row.id} initial={analysis?.status || "New"} compact />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
