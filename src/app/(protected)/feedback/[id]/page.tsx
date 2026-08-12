import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Muted, SentimentBadge } from "@/components/ui/ui";
import { requireAuth } from "@/lib/api";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackItem } from "@/lib/services/feedback-service";
import { formatDateUTC, sevColor } from "@/lib/utils";
import StatusChanger from "./status-changer";

function TopicTag({ topic }: { topic: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded border border-border bg-muted/30 text-xs">{topic}</span>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireAuth();
  const { id } = await params;
  const item = await getFeedbackItem(userId, id);
  if (!item) notFound();
  const a = item.feedback_analyses;

  const severityColor = sevColor(a?.severity_score ?? 0);

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
        <div className="lg:col-span-2 space-y-2">
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
              {a?.severity_score ? (
                <span className={severityColor}>
                  severity {a.severity_score}/{MAX_SEVERITY}
                </span>
              ) : null}
            </div>
            {a?.topics && a.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {a.topics.map((t) => (
                  <TopicTag key={t} topic={t} />
                ))}
              </div>
            )}
          </Card>

          <Card title="raw content">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed bg-muted/20 rounded border border-border p-3 overflow-auto max-h-96 text-foreground/80">
              {item.raw_content || "no content"}
            </pre>
          </Card>
        </div>

        <div className="space-y-2">
          <Card title="analysis">
            {!a ? (
              <Muted>no analysis yet</Muted>
            ) : (
              <dl className="space-y-3">
                <Detail label="sentiment">
                  <SentimentBadge sentiment={a.sentiment} />
                </Detail>
                <Detail label="severity">
                  <span className={`text-2xl font-medium leading-none ${severityColor}`}>
                    {a.severity_score}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{MAX_SEVERITY}
                    </span>
                  </span>
                </Detail>
                <Detail label="status">
                  <span className="text-sm">{a.status.toLowerCase()}</span>
                </Detail>
                <Detail label="source">
                  <span className="text-sm">{item.source}</span>
                </Detail>
                {a.topics && a.topics.length > 0 && (
                  <Detail label="topics">
                    <div className="flex flex-wrap gap-1">
                      {a.topics.map((t) => (
                        <TopicTag key={t} topic={t} />
                      ))}
                    </div>
                  </Detail>
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
                  {item.id}
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
