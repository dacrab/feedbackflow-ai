import { z } from "zod";
import { Button, ButtonLink, Input, Muted, PageHeader, Select } from "@/components/ui/ui";
import { requireAuth } from "@/lib/api";
import { getFeedbackItems } from "@/lib/services/feedback-service";
import { FEEDBACK_STATUS_OPTIONS, SENTIMENT_OPTIONS } from "@/lib/types";
import { InboxBulkActions } from "./bulk-actions";

const DEFAULT_PAGE_SIZE = 20;
const SORT_OPTIONS = ["created_desc", "severity_desc", "severity_asc"] as const;

const SearchParamsSchema = z.object({
  sentiment: z.enum(SENTIMENT_OPTIONS).optional(),
  status: z.enum(FEEDBACK_STATUS_OPTIONS).optional(),
  topic: z.string().max(100).optional(),
  q: z.string().max(200).optional(),
  sort: z.enum(SORT_OPTIONS).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

function parseInboxParams(spObj: Record<string, string | string[] | undefined>) {
  const sp = new URLSearchParams(
    Object.entries(spObj).flatMap(([k, v]) => (typeof v === "string" && v ? [[k, v]] : [])),
  );

  const parsed = SearchParamsSchema.safeParse(Object.fromEntries(sp));
  const spv = parsed.success ? parsed.data : {};

  const sentiment = spv.sentiment;
  const status = spv.status;
  const topic = spv.topic;
  const q = spv.q;
  const sort = spv.sort ?? "created_desc";
  const page = spv.page ?? 1;

  const filters = {
    ...(sentiment && { sentiment }),
    ...(status && { status }),
    ...(topic && { topic }),
    ...(q && { q }),
    sort,
  };

  const hasFilters = !!(q || sentiment || status || topic);

  return { sp, filters, sort, page, hasFilters };
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireAuth();

  const spObj = await searchParams;
  const { sp, filters, page, hasFilters } = parseInboxParams(spObj);

  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  const { items, total: totalCount } = await getFeedbackItems(userId, {
    limit: DEFAULT_PAGE_SIZE,
    offset,
    filters,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  function pageUrl(p: number) {
    const params = new URLSearchParams(sp);
    params.set("page", String(p));
    return `/inbox?${params.toString()}`;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-end justify-between shrink-0">
        <PageHeader eyebrow="feedback items" title="inbox" />
        <Muted className="text-sm">
          {totalCount} {hasFilters ? "filtered" : "total"}
        </Muted>
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
          {SENTIMENT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={sp.get("status") || ""} size="sm">
          <option value="">all status</option>
          {FEEDBACK_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </Select>
        <Select name="sort" defaultValue={sp.get("sort") || "created_desc"} size="sm">
          <option value="created_desc">newest</option>
          <option value="severity_desc">severity ↓</option>
          <option value="severity_asc">severity ↑</option>
        </Select>
        <Button size="sm" variant="outline" type="submit" className="text-xs">
          apply
        </Button>
        {hasFilters && (
          <ButtonLink href="/inbox" size="sm" variant="ghost" className="text-xs animate-fade-in">
            clear
          </ButtonLink>
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
              <ButtonLink size="xs" href={pageUrl(page - 1)}>
                ← prev
              </ButtonLink>
            ) : (
              <Button size="xs" disabled>
                ← prev
              </Button>
            )}
            {page < totalPages ? (
              <ButtonLink size="xs" href={pageUrl(page + 1)}>
                next →
              </ButtonLink>
            ) : (
              <Button size="xs" disabled>
                next →
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
