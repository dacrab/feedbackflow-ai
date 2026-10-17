import type { ReactNode } from "react";
import { z } from "zod";
import { Button, ButtonLink, Input, Muted, PageHeader, Select } from "@/components/ui/ui";
import { requireAuth } from "@/lib/api";
import { MAX_SEARCH_TERM_LENGTH } from "@/lib/constants";
import { getFeedbackItems } from "@/lib/services/feedback-service";
import {
  FEEDBACK_STATUS_OPTIONS,
  INBOX_SORT_LABELS,
  INBOX_SORT_OPTIONS,
  type InboxSort,
  SENTIMENT_OPTIONS,
} from "@/lib/types";
import { InboxList } from "./inbox-list";

const PAGE_SIZE = 20;

const SearchParamsSchema = z.object({
  sentiment: z.enum(SENTIMENT_OPTIONS).optional(),
  status: z.enum(FEEDBACK_STATUS_OPTIONS).optional(),
  topic: z.string().max(MAX_SEARCH_TERM_LENGTH).optional(),
  q: z.string().max(MAX_SEARCH_TERM_LENGTH).optional(),
  sort: z.enum(INBOX_SORT_OPTIONS).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

type SearchParams = z.infer<typeof SearchParamsSchema>;

const FILTER_KEYS = ["q", "sentiment", "status", "topic"] as const;
const DEFAULT_SORT: InboxSort = "created_desc";

function Pager({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <Button size="xs" disabled>
        {children}
      </Button>
    );
  }
  return (
    <ButtonLink size="xs" href={href}>
      {children}
    </ButtonLink>
  );
}

/** Per-param, so one invalid value cannot discard every other filter. */
function parseInboxParams(raw: Record<string, string | string[] | undefined>) {
  const shape = SearchParamsSchema.shape;
  const pick = <K extends keyof SearchParams>(key: K): SearchParams[K] => {
    const value = raw[key];
    if (typeof value !== "string" || value === "") return undefined;
    const parsed = shape[key].safeParse(value);
    return parsed.success ? (parsed.data as SearchParams[K]) : undefined;
  };

  const filters = {
    q: pick("q"),
    sentiment: pick("sentiment"),
    status: pick("status"),
    topic: pick("topic"),
  };
  return {
    filters,
    sort: pick("sort") ?? DEFAULT_SORT,
    page: pick("page") ?? 1,
    hasFilters: FILTER_KEYS.some((key) => filters[key] !== undefined),
  };
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireAuth();

  const { filters, sort, page, hasFilters } = parseInboxParams(await searchParams);

  async function load(target: number) {
    return getFeedbackItems(userId, {
      limit: PAGE_SIZE,
      offset: (target - 1) * PAGE_SIZE,
      filters: { ...filters, sort },
    });
  }

  const requested = await load(page);
  const totalPages = Math.max(1, Math.ceil(requested.total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  // A stale ?page= asks for an offset past the last row, where the query
  // returns nothing; only then is a second read worth paying for.
  const { items } = currentPage === page ? requested : await load(currentPage);

  // Built from validated values, so a rejected param is not carried forward.
  function pageUrl(target: number) {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = filters[key];
      if (value) params.set(key, value);
    }
    if (sort !== DEFAULT_SORT) params.set("sort", sort);
    params.set("page", String(target));
    return `/inbox?${params.toString()}`;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-end justify-between shrink-0">
        <PageHeader eyebrow="feedback items" title="inbox" />
        <Muted className="text-sm">
          {requested.total} {hasFilters ? "filtered" : "total"}
        </Muted>
      </div>

      <form className="grid gap-2 grid-cols-2 sm:flex sm:flex-wrap sm:items-center shrink-0">
        <label htmlFor="inbox-search" className="sr-only">
          search feedback
        </label>
        <Input
          id="inbox-search"
          type="search"
          name="q"
          placeholder="search..."
          defaultValue={filters.q ?? ""}
          className="col-span-2 sm:flex-1 sm:min-w-[160px] sm:max-w-xs"
        />
        <Select aria-label="sentiment" name="sentiment" defaultValue={filters.sentiment ?? ""}>
          <option value="">all sentiment</option>
          {SENTIMENT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select aria-label="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">all status</option>
          {FEEDBACK_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </Select>
        <Select aria-label="sort order" name="sort" defaultValue={sort}>
          {INBOX_SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {INBOX_SORT_LABELS[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" className="text-xs">
          apply
        </Button>
        {hasFilters && (
          <ButtonLink href="/inbox" variant="ghost" className="text-xs animate-fade-in">
            clear
          </ButtonLink>
        )}
      </form>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Remounts on navigation so the selection can never outlive the page
            it was made on. */}
        <InboxList key={pageUrl(currentPage)} items={items} />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <Muted>
            page {currentPage} / {totalPages}
          </Muted>
          <div className="flex gap-1">
            <Pager href={pageUrl(currentPage - 1)} disabled={currentPage <= 1}>
              ← prev
            </Pager>
            <Pager href={pageUrl(currentPage + 1)} disabled={currentPage >= totalPages}>
              next →
            </Pager>
          </div>
        </div>
      )}
    </div>
  );
}
