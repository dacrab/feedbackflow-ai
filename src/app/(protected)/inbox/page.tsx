import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SentimentBadge, StatusBadge } from "@/components/ui/badges";
import { Input, Select } from "@/components/ui/ui";
import { getServerSession } from "@/lib/api";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackItems } from "@/lib/services/feedback-service";
import type { FeedbackStatus, Sentiment } from "@/lib/types";
import { formatDateUTC } from "@/lib/utils";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const spObj = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(spObj).flatMap(([k, v]) => (typeof v === "string" && v ? [[k, v]] : [])),
  );

  const sentiment = (sp.get("sentiment") as Sentiment | undefined) || undefined;
  const status = (sp.get("status") as FeedbackStatus | undefined) || undefined;
  const topic = sp.get("topic") || undefined;
  const q = sp.get("q") || undefined;

  const severityMin = Number.parseInt(sp.get("severity_min") ?? "1", 10);
  const severityMax = Number.parseInt(sp.get("severity_max") ?? String(MAX_SEVERITY), 10);

  const sort =
    (spObj["sort"] as "created_desc" | "severity_desc" | "severity_asc") || "created_desc";

  const items = await getFeedbackItems(userId, {
    limit: 100,
    filters: {
      ...(sentiment && { sentiment }),
      ...(status && { status }),
      ...(topic && { topic }),
      ...(q && { q }),
      severityMin,
      severityMax,
      sort,
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">// feedback items</p>
        <h1 className="text-xl font-medium">inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">{items.length} items</p>
      </div>

      <form className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          name="q"
          placeholder="search..."
          defaultValue={sp.get("q") || ""}
          variant="sm"
          className="flex-1 min-w-[180px] max-w-xs"
        />

        <Select
          name="sentiment"
          defaultValue={sp.get("sentiment") || ""}
          size="sm"
        >
          <option value="">all sentiment</option>
          <option value="positive">positive</option>
          <option value="neutral">neutral</option>
          <option value="negative">negative</option>
        </Select>

        <Select
          name="status"
          defaultValue={sp.get("status") || ""}
          size="sm"
        >
          <option value="">all status</option>
          <option value="New">new</option>
          <option value="Acknowledged">acknowledged</option>
          <option value="Actioned">actioned</option>
        </Select>

        <button
          type="submit"
          className="h-8 px-3 rounded bg-muted text-sm hover:bg-muted/80 transition-colors"
        >
          filter
        </button>
      </form>

      <div className="rounded border border-border bg-card divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <p>no items found</p>
            <p className="mt-1">add a data source in settings to get started</p>
          </div>
        ) : (
          items.map((item) => {
            const analysis = item.feedback_analyses;
            const severity = analysis?.severity_score ?? 0;

            return (
              <Link
                key={item.id}
                href={`/feedback/${item.id}`}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors group"
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    severity >= 4
                      ? "bg-red-500"
                      : severity >= 3
                        ? "bg-orange-500"
                        : "bg-muted-foreground/30"
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate">{analysis?.summary || "no summary"}</span>
                    <SentimentBadge sentiment={analysis?.sentiment} />
                    <StatusBadge status={analysis?.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="truncate max-w-[200px]">{item.raw_content}</span>
                    {analysis?.topics?.[0] && (
                      <>
                        <span>·</span>
                        <span>[{analysis.topics[0]}]</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span suppressHydrationWarning>{formatDateUTC(item.created_at)}</span>
                  <IconChevronRight className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
