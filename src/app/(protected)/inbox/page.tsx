import Link from "next/link";
import { Input, Select } from "@/components/ui/ui";
import { getServerSession } from "@/lib/api";
import { MAX_SEVERITY } from "@/lib/constants";
import { getFeedbackCount, getFeedbackItems } from "@/lib/services/feedback-service";
import type { FeedbackStatus, Sentiment } from "@/lib/types";
import { InboxBulkActions } from "./bulk-actions";

const DEFAULT_PAGE_SIZE = 20;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}) {
  const session = await getServerSession();
  const userId = session?.user?.id as string;

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
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10));
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
    severityMin,
    severityMax,
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">// feedback items</p>
          <h1 className="text-xl font-medium">inbox</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalCount} {hasFilters ? "filtered" : "total"}
        </p>
      </div>

      {/* Filter bar */}
      <form className="grid gap-2 grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
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
            className="h-8 px-3 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center"
          >
            clear
          </Link>
        )}
      </form>

      <InboxBulkActions items={items} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            page {page} / {totalPages}
          </span>
          <div className="flex gap-1">
            {page > 1 ? (
              <Link
                href={pageUrl(page - 1)}
                className="h-7 px-3 rounded border border-border hover:bg-muted transition-colors inline-flex items-center"
              >
                ← prev
              </Link>
            ) : (
              <span className="h-7 px-3 rounded border border-border/50 text-muted-foreground/50 inline-flex items-center">
                ← prev
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={pageUrl(page + 1)}
                className="h-7 px-3 rounded border border-border hover:bg-muted transition-colors inline-flex items-center"
              >
                next →
              </Link>
            ) : (
              <span className="h-7 px-3 rounded border border-border/50 text-muted-foreground/50 inline-flex items-center">
                next →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
