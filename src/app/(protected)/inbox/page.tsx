import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SentimentBadge } from "@/components/ui/sentiment-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFeedbackItems } from "@/lib/services/feedback-service";
import { filterFeedbackItems, parseFeedbackFilters } from "@/lib/services/query-builder";
import { formatDateUTC } from "@/lib/utils";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    redirect("/login");
  }

  const spObj = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(spObj)) {
    if (typeof v === "string" && v) {
      sp.set(k, v);
    }
  }

  const filters = parseFeedbackFilters(sp);
  const allItems = await getFeedbackItems(userId, { limit: 100 });
  const items = filterFeedbackItems(allItems, filters);

  const sort = (spObj["sort"] as string) || "created_desc";
  items.sort((a, b) => {
    const aA = a.feedback_analyses;
    const bA = b.feedback_analyses;
    if (sort === "severity_desc") {
      return (bA?.severity_score ?? 0) - (aA?.severity_score ?? 0);
    }
    if (sort === "severity_asc") {
      return (aA?.severity_score ?? 0) - (bA?.severity_score ?? 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">// feedback items</p>
        <h1 className="text-xl font-medium">inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">{items.length} items</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <form className="flex-1 min-w-[180px] max-w-xs">
          <input
            type="text"
            name="q"
            placeholder="search..."
            defaultValue={sp.get("q") || ""}
            className="w-full h-8 px-3 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground transition-colors"
          />
        </form>

        <select
          name="sentiment"
          defaultValue={sp.get("sentiment") || ""}
          className="h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
        >
          <option value="">all sentiment</option>
          <option value="positive">positive</option>
          <option value="neutral">neutral</option>
          <option value="negative">negative</option>
        </select>

        <select
          name="status"
          defaultValue={sp.get("status") || ""}
          className="h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
        >
          <option value="">all status</option>
          <option value="New">new</option>
          <option value="Acknowledged">acknowledged</option>
          <option value="Actioned">actioned</option>
        </select>
      </div>

      {/* Items */}
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
                    severity >= 4 ? "bg-red-500" : severity >= 3 ? "bg-orange-500" : "bg-muted-foreground/30"
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
                  <ChevronRight className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
