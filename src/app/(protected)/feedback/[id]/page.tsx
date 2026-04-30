import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SentimentBadge } from "@/components/ui/sentiment-badge";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackItem } from "@/lib/services/feedback-service";
import { getServerSession } from "@/lib/session";
import { formatDateUTC } from "@/lib/utils";
import StatusChanger from "./status-changer";

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const { id } = await params;

  const item = await getFeedbackItem(userId, id);
  const analysis = item.feedback_analyses;
  const topics = analysis?.topics ?? [];
  const severity = analysis?.severity_score;

  return (
    <div className="space-y-4">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        back
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">// summary</p>
                <h1 className="text-lg font-medium mt-1">{analysis?.summary || "no summary"}</h1>
              </div>
              <StatusChanger id={item.id} initial={analysis?.status || "New"} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground" suppressHydrationWarning>
                {formatDateUTC(item.created_at)}
              </span>
              <SentimentBadge sentiment={analysis?.sentiment} />
              {severity && (
                <span
                  className={`text-xs ${severity >= 4 ? "text-red-500" : severity >= 3 ? "text-orange-500" : "text-muted-foreground"}`}
                >
                  severity: {severity}/{MAX_SEVERITY}
                </span>
              )}
            </div>

            {topics.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <span key={topic} className="px-2 py-0.5 rounded bg-muted text-xs">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-3">// raw content</p>
            <pre className="whitespace-pre-wrap bg-muted rounded p-3 text-sm overflow-auto max-h-80">
              {item.raw_content || "no content"}
            </pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-3">// analysis</p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">sentiment</dt>
                <dd className="mt-0.5">
                  {analysis?.sentiment ? (
                    <SentimentBadge sentiment={analysis.sentiment} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">severity</dt>
                <dd className="mt-0.5 text-xl font-medium">
                  {severity ?? "—"}
                  <span className="text-sm font-normal text-muted-foreground">/{MAX_SEVERITY}</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">source</dt>
                <dd className="mt-0.5">{item.source}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-3">// actions</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>→ update status to track progress</li>
              <li>→ severity 4+ triggers slack alerts</li>
              <li>→ review related items in inbox</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
