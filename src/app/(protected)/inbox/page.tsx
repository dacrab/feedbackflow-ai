import Link from "next/link";
import { Input, Select } from "@/components/ui/ui";
import { getServerSession } from "@/lib/api";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackCount, getFeedbackItems } from "@/lib/services/feedback-service";
import { type FeedbackStatus, isFeedbackStatus, type Sentiment } from "@/lib/types";
import { InboxBulkActions } from "./bulk-actions";

const DEFAULT_PAGE_SIZE = 20;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}) {
  const session = await getServerSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const spObj = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(spObj).flatMap(([k, v]) => (typeof v === "string" && v ? [[k, v]] : [])),
  );

  const rawSentiment = sp.get("sentiment");
  const sentiment: Sentiment | undefined =
    rawSentiment === "positive" || rawSentiment === "neutral" || rawSentiment === "negative"
      ? rawSentiment
      : undefined;
  const rawStatus = sp.get("status");
  const status: FeedbackStatus | undefined = isFeedbackStatus(rawStatus) ? rawStatus : undefined;
  const topic = sp.get("topic") || undefined;
  const q = sp.get("q") || undefined;
  const severityMin = Number.parseInt(sp.get("severity_min") ?? "1", 10);
  const severityMax = Number.parseInt(sp.get("severity_max") ?? String(MAX_SEVERITY), 10);
  const rawSort = sp.get("sort");
  const sort: "created_desc" | "severity_desc" | "severity_asc" =
    rawSort === "created_desc" || rawSort === "severity_desc" || rawSort === "severity_asc"
      ? rawSort
      : "created_desc";
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(sp.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)),
  );
  const offset = (page - 1) * pageSize;

  const filters = {
    ...(sentiment && { sentiment }),
    ...(status && { status }),
    ...(topic && { topic }),
    ...(q && { q }),
    ...(severityMin > 1 && { severityMin }),
    ...(severityMax < MAX_SEVERITY && { severityMax }),
    sort,
  };

  const [items, totalCount] = await Promise.all([
    getFeedbackItems(userId, { limit: pageSize, offset, filters }),
    getFeedbackCount(userId, filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function pageUrl(p: number) {
    const params = new URLSearchParams(sp);
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));
    return `/inbox?${params.toString()}`;
  }

  const hasFilters = !!(q || sentiment || status || topic);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-end justify-between shrink-0">
        <div>
          <p className="text-xs text-muted-foreground">// feedback items</p>
          <h1 className="text-xl font-medium">inbox</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalCount} {hasFilters ? "filtered" : "total"}
        </p>
      </div>

      <form className="grid gap-2 grid-cols-2 sm:flex sm:flex-wrap sm:items-center shrink-0">
        <Input
          id="inbox-search"
          type="text"
          name="q"
          placeholder="search..."
          defaultValue={sp.get("q") || ""}
          variant="sm"
          className="col-span-2 sm:flex-1 sm:min-w-[160px] sm:max-w-xs"
        />
        <Select name="sentiment" defaultValue={sp.get("sentiment") || ""} size="sm">
          <option value="">all sentiment</option>
          <option value="positive">positive</option>
          <option value="neutral">neutral</option>
          <option value="negative">negative</option>
        </Select>
        <Select name="status" defaultValue={sp.get("status") || ""} size="sm">
          <option value="">all status</option>
          <option value="New">new</option>
          <option value="Acknowledged">acknowledged</option>
          <option value="Actioned">actioned</option>
        </Select>
        <Select name="sort" defaultValue={sp.get("sort") || "created_desc"} size="sm">
          <option value="created_desc">newest</option>
          <option value="severity_desc">severity ↓</option>
          <option value="severity_asc">severity ↑</option>
        </Select>
        <button
          type="submit"
          className="h-8 px-3 rounded border border-border text-xs hover:bg-muted transition-colors"
        >
          apply
        </button>
        {hasFilters && (
          <Link
            href="/inbox"
            className="h-8 px-3 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center animate-fade-in"
          >
            clear
          </Link>
        )}
      </form>

      <div className="flex-1 overflow-y-auto min-h-0">
        <InboxBulkActions items={items} />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <span>
            page {page} / {totalPages}
          </span>
          <div className="flex gap-1">
            {page > 1 ? (
              <Link href={pageUrl(page - 1)} className="page-btn">
                ← prev
              </Link>
            ) : (
              <span className="page-btn page-btn-disabled">← prev</span>
            )}
            {page < totalPages ? (
              <Link href={pageUrl(page + 1)} className="page-btn">
                next →
              </Link>
            ) : (
              <span className="page-btn page-btn-disabled">next →</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
