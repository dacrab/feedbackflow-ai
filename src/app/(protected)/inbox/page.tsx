import { IconDownload } from "@tabler/icons-react";
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

  // Build export URL with current filters
  const exportParams = new URLSearchParams(sp);
  exportParams.delete("page");
  exportParams.delete("pageSize");
  const exportUrl = `/api/export?${exportParams.toString()}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">// feedback items</p>
          <h1 className="text-xl font-medium">inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">{totalCount} items</p>
        </div>
        <a
          href={exportUrl}
          className="h-8 px-3 rounded bg-muted text-sm hover:bg-muted/80 transition-colors inline-flex items-center gap-1.5"
          aria-label="Export filtered feedback as CSV"
        >
          <IconDownload className="h-3.5 w-3.5" />
          Export CSV
        </a>
      </div>

      <form className="flex flex-wrap items-center gap-2">
        <label htmlFor="inbox-search" className="sr-only">
          Search feedback
        </label>
        <Input
          id="inbox-search"
          type="text"
          name="q"
          placeholder="search..."
          defaultValue={sp.get("q") || ""}
          variant="sm"
          className="flex-1 min-w-[180px] max-w-xs"
        />

        <label htmlFor="inbox-sentiment" className="sr-only">
          Filter by sentiment
        </label>
        <Select
          id="inbox-sentiment"
          name="sentiment"
          defaultValue={sp.get("sentiment") || ""}
          size="sm"
        >
          <option value="">all sentiment</option>
          <option value="positive">positive</option>
          <option value="neutral">neutral</option>
          <option value="negative">negative</option>
        </Select>

        <label htmlFor="inbox-status" className="sr-only">
          Filter by status
        </label>
        <Select id="inbox-status" name="status" defaultValue={sp.get("status") || ""} size="sm">
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

      <InboxBulkActions items={items} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageUrl(page - 1)}
                className="h-8 px-3 rounded bg-muted hover:bg-muted/80 transition-colors inline-flex items-center"
              >
                previous
              </Link>
            ) : (
              <span className="h-8 px-3 rounded bg-muted/50 text-muted-foreground inline-flex items-center cursor-not-allowed">
                previous
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={pageUrl(page + 1)}
                className="h-8 px-3 rounded bg-muted hover:bg-muted/80 transition-colors inline-flex items-center"
              >
                next
              </Link>
            ) : (
              <span className="h-8 px-3 rounded bg-muted/50 text-muted-foreground inline-flex items-center cursor-not-allowed">
                next
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
