import { ArrowLeft, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFeedbackItem } from "@/lib/services/feedback-service";
import { formatDateUTC } from "@/lib/utils/date";
import StatusChanger from "./status-changer";

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect("/login");

  const { id } = await params;
  const item = await getFeedbackItem(userId, id);
  const analysis = Array.isArray(item.feedback_analyses)
    ? item.feedback_analyses[0]
    : item.feedback_analyses;

  const topics = analysis?.topics || [];

  return (
    <div className="space-y-6">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inbox
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Summary</p>
                <h1 className="text-xl font-semibold">
                  {analysis?.summary || "No summary available"}
                </h1>
              </div>
              <StatusChanger id={item.id} initial={analysis?.status || "New"} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span suppressHydrationWarning>{formatDateUTC(item.created_at)}</span>
              </div>
              <SentimentBadge sentiment={analysis?.sentiment ?? null} />
              <SeverityBadge score={analysis?.severity_score ?? null} />
            </div>

            {topics.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Raw content */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium mb-4">Original Feedback</h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap bg-muted rounded-lg p-4 text-sm font-mono overflow-auto max-h-96">
                {item.raw_content || "No content available"}
              </pre>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Analysis details */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium mb-4">AI Analysis</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-muted-foreground">Sentiment</dt>
                <dd className="mt-1">
                  <SentimentBadge sentiment={analysis?.sentiment ?? null} large />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Severity Score</dt>
                <dd className="mt-1 text-2xl font-semibold">
                  {analysis?.severity_score ?? "—"}
                  <span className="text-sm font-normal text-muted-foreground"> / 5</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Source</dt>
                <dd className="mt-1 capitalize">{item.source}</dd>
              </div>
            </dl>
          </div>

          {/* Actions card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium mb-4">Quick Actions</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Update status to track progress</p>
              <p>• High severity items trigger Slack notifications</p>
              <p>• Review related feedback in the inbox</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment, large }: { sentiment?: string | null; large?: boolean }) {
  if (!sentiment) return <span className="text-muted-foreground">—</span>;

  const colors = {
    positive: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    negative: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full font-medium capitalize ${colors[sentiment as keyof typeof colors] || colors.neutral} ${large ? "text-sm" : "text-xs"}`}
    >
      {sentiment}
    </span>
  );
}

function SeverityBadge({ score }: { score?: number | null }) {
  if (!score) return null;

  const colors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  const level = score >= 4 ? "high" : score >= 3 ? "medium" : "low";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[level]}`}>
      Severity {score}
    </span>
  );
}
