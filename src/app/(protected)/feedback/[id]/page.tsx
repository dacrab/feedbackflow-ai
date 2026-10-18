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

/** Browser-tab length; a long summary is truncated to keep the title usable. */
const TITLE_MAX_LENGTH = 60;

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
  return { title: summary ? summary.slice(0, TITLE_MAX_LENGTH) : "feedback" };
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
        className="inline-flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="size-3" />
        back to inbox
      </Link>

      <div className="grid animate-fade-up gap-2 [animation-fill-mode:both] lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <Card title="summary">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-medium text-base leading-snug">{a?.summary || "no summary"}</h1>
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
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/20 p-3 font-mono text-foreground/80 text-xs leading-relaxed">
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
                    className={`font-medium text-2xl leading-none ${sevColor(a.severity_score)}`}
                  >
                    {a.severity_score}
                    <span className="font-normal text-muted-foreground text-sm">
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
