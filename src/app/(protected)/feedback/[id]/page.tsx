import { IconArrowLeft } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, KeyValue, Muted, SentimentBadge, TopicTag } from "@/components/ui/ui";
import { requireAuth } from "@/lib/api";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackItem } from "@/lib/services/feedback-service";
import { uuidSchema } from "@/lib/types";
import { formatDateUTC, sevColor } from "@/lib/utils";
import StatusChanger from "./status-changer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const userId = await requireAuth();
  const { id } = await params;
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { title: "not found" };
  const item = await getFeedbackItem(userId, parsed.data);
  const summary = item?.feedback_analyses?.summary;
  return { title: summary ? summary.slice(0, 60) : "feedback" };
}

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireAuth();
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();
  const item = await getFeedbackItem(userId, parsedId.data);
  if (!item) notFound();

  const a = item.feedback_analyses;
  const created = formatDateUTC(item.created_at);
  const topics = a?.topics ?? [];

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
              {/* Sole owner of the status widget, so it cannot disagree with a
                  read-only copy until revalidation lands. */}
              <StatusChanger id={item.id} initial={a?.status ?? "New"} />
            </div>
            <Muted suppressHydrationWarning>{created}</Muted>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {topics.map((t) => (
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
                <KeyValue label="sentiment">
                  <SentimentBadge sentiment={a.sentiment} />
                </KeyValue>
                <KeyValue label="severity">
                  <span
                    className={`text-2xl font-medium leading-none ${sevColor(a.severity_score)}`}
                  >
                    {a.severity_score}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{MAX_SEVERITY}
                    </span>
                  </span>
                </KeyValue>
              </dl>
            )}
          </Card>

          <Card title="metadata">
            <dl className="space-y-2 text-xs">
              <KeyValue label="id" layout="row">
                <span className="font-mono text-muted-foreground" title={item.id}>
                  {item.id}
                </span>
              </KeyValue>
              <KeyValue label="created" layout="row">
                <Muted suppressHydrationWarning>{created}</Muted>
              </KeyValue>
              <KeyValue label="source" layout="row">
                {item.source}
              </KeyValue>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
