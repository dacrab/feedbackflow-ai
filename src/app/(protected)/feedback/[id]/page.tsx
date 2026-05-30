import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SentimentBadge } from "@/components/ui/badges";
import { Card } from "@/components/ui/ui";
import { getServerSession } from "@/lib/api";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackItem } from "@/lib/services/feedback-service";
import { formatDateUTC } from "@/lib/utils";
import StatusChanger from "./status-changer";

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  const userId = session?.user?.id;
  const { id } = await params;
  if (!userId) notFound();
  const item = await getFeedbackItem(userId, id).catch(() => null);
  if (!item) notFound();
  const a = item.feedback_analyses;

  const severityColor =
    (a?.severity_score ?? 0) >= 4
      ? "text-red-500"
      : (a?.severity_score ?? 0) >= 3
        ? "text-orange-500"
        : "text-muted-foreground";

  return (
    <div className="space-y-4">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-3 w-3" />
        back to inbox
      </Link>

      <div className="grid gap-2 lg:grid-cols-3 animate-fade-up [animation-fill-mode:both]">
        {/* Main — 2 cols */}
        <div className="lg:col-span-2 space-y-2">
          {/* Summary card */}
          <Card title="summary">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-base font-medium leading-snug">{a?.summary || "no summary"}</h1>
              <StatusChanger id={item.id} initial={a?.status ?? "New"} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span suppressHydrationWarning>{formatDateUTC(item.created_at)}</span>
              <span>·</span>
              <span>{item.source}</span>
              <SentimentBadge sentiment={a?.sentiment} />
              {a?.severity_score && (
                <span className={severityColor}>
                  severity {a.severity_score}/{MAX_SEVERITY}
                </span>
              )}
            </div>
            {(a?.topics?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {a?.topics.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded border border-border bg-muted/30 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Raw content */}
          <Card title="raw content">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed bg-muted/20 rounded border border-border p-3 overflow-auto max-h-96 text-foreground/80">
              {item.raw_content || "no content"}
            </pre>
          </Card>
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-2">
          <Card title="analysis">
            {!a ? (
              <p className="text-xs text-muted-foreground">no analysis yet</p>
            ) : (
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-muted-foreground">sentiment</dt>
                  <dd className="mt-0.5">
                    <SentimentBadge sentiment={a.sentiment} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">severity</dt>
                  <dd className={`mt-0.5 text-2xl font-medium leading-none ${severityColor}`}>
                    {a.severity_score}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{MAX_SEVERITY}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">status</dt>
                  <dd className="mt-0.5 text-sm">{a.status.toLowerCase()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">source</dt>
                  <dd className="mt-0.5 text-sm">{item.source}</dd>
                </div>
                {(a.topics?.length ?? 0) > 0 && (
                  <div>
                    <dt className="text-xs text-muted-foreground">topics</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {a.topics.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded border border-border bg-muted/30 text-xs"
                        >
                          {t}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </Card>

          <Card title="metadata">
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">id</dt>
                <dd
                  className="font-mono text-muted-foreground truncate max-w-[120px]"
                  title={item.id}
                >
                  {item.id.slice(0, 8)}…
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">created</dt>
                <dd suppressHydrationWarning>{formatDateUTC(item.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">source</dt>
                <dd>{item.source}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
