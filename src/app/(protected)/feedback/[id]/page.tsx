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
  const { id } = await params;

  const item = await getFeedbackItem(session?.user?.id as string, id).catch(() => null);
  if (!item) notFound();
  const a = item.feedback_analyses;

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
          <Card title="summary">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-lg font-medium">{a?.summary || "no summary"}</h1>
              <StatusChanger id={item.id} initial={a?.status ?? "New"} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground" suppressHydrationWarning>
                {formatDateUTC(item.created_at)}
              </span>
              <SentimentBadge sentiment={a?.sentiment} />
              {a?.severity_score && (
                <span
                  className={`text-xs ${a.severity_score >= 4 ? "text-red-500" : a.severity_score >= 3 ? "text-orange-500" : "text-muted-foreground"}`}
                >
                  severity: {a.severity_score}/{MAX_SEVERITY}
                </span>
              )}
            </div>
            {(a?.topics?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {a?.topics.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-muted text-xs">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card title="raw content">
            <pre className="whitespace-pre-wrap bg-muted rounded p-3 text-sm overflow-auto max-h-80">
              {item.raw_content || "no content"}
            </pre>
          </Card>
        </div>

        <Card title="analysis">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">sentiment</dt>
              <dd className="mt-0.5">
                {a?.sentiment ? (
                  <SentimentBadge sentiment={a.sentiment} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">severity</dt>
              <dd className="mt-0.5 text-xl font-medium">
                {a?.severity_score ?? "—"}
                <span className="text-sm font-normal text-muted-foreground">/{MAX_SEVERITY}</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">source</dt>
              <dd className="mt-0.5">{item.source}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
