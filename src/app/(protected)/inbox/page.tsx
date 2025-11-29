import { ChevronRight, Filter, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFeedbackItems } from "@/lib/services/feedback-service";
import { filterFeedbackItems, parseFeedbackFilters } from "@/lib/services/query-builder";
import { formatDateUTC } from "@/lib/utils/date";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect("/login");

  const spObj = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(spObj)) {
    if (typeof v === "string" && v) sp.set(k, v);
  }

  const filters = parseFeedbackFilters(sp);
  const allItems = await getFeedbackItems(userId, { limit: 100 });
  const items = filterFeedbackItems(allItems, filters);

  const sort = (spObj["sort"] as string) || "created_desc";
  items.sort((a, b) => {
    const aA = Array.isArray(a.feedback_analyses) ? a.feedback_analyses[0] : a.feedback_analyses;
    const bA = Array.isArray(b.feedback_analyses) ? b.feedback_analyses[0] : b.feedback_analyses;
    if (sort === "severity_desc") return (bA?.severity_score ?? 0) - (aA?.severity_score ?? 0);
    if (sort === "severity_asc") return (aA?.severity_score ?? 0) - (bA?.severity_score ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground mt-1">{items.length} feedback items</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              placeholder="Search feedback..."
              defaultValue={sp.get("q") || ""}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>

        <select
          name="sentiment"
          defaultValue={sp.get("sentiment") || ""}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All sentiment</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>

        <select
          name="status"
          defaultValue={sp.get("status") || ""}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All status</option>
          <option value="New">New</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="Actioned">Actioned</option>
        </select>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No feedback items found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or add a data source in settings
            </p>
          </div>
        ) : (
          items.map((item) => {
            const analysis = Array.isArray(item.feedback_analyses)
              ? item.feedback_analyses[0]
              : item.feedback_analyses;

            return (
              <Link
                key={item.id}
                href={`/feedback/${item.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
              >
                {/* Severity indicator */}
                <div
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    (analysis?.severity_score ?? 0) >= 4
                      ? "bg-red-500"
                      : (analysis?.severity_score ?? 0) >= 3
                        ? "bg-orange-500"
                        : "bg-muted-foreground/30"
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{analysis?.summary || "No summary"}</p>
                    <SentimentBadge sentiment={analysis?.sentiment ?? null} />
                    <StatusBadge status={analysis?.status ?? null} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="truncate max-w-xs">{item.raw_content}</span>
                    {analysis?.topics && analysis.topics.length > 0 && (
                      <>
                        <span className="text-border">·</span>
                        <span className="shrink-0">{analysis.topics[0]}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {formatDateUTC(item.created_at)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment?: string | null }) {
  if (!sentiment) return null;

  const colors = {
    positive: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    negative: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[sentiment as keyof typeof colors] || colors.neutral}`}
    >
      {sentiment}
    </span>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status || status === "New") return null;

  const colors = {
    Acknowledged: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Actioned: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status as keyof typeof colors] || ""}`}
    >
      {status}
    </span>
  );
}
