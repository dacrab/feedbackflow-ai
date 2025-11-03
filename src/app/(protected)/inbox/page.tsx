import { cookies, headers } from "next/headers";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { FeedbackItem } from "@/lib/types";
import { formatDateUTC } from "@/lib/utils/date";
import { SentimentBadge } from "@/lib/utils/sentiment";
import { StatusBadge } from "@/lib/utils/status";

async function getData(searchParams: Record<string, string | string[] | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string" && v) sp.set(k, v);
  }
  const qs = sp.toString();
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("host");
  const base = host ? `${proto}://${host}` : "http://localhost:3000";
  const url = `${base}/api/feedback${qs ? `?${qs}` : ""}`;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`failed to load feedback (${res.status}): ${text}`);
  }
  return res.json();
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const spObj = await searchParams;
  const data = await getData(spObj);
  const items = (data.items as FeedbackItem[]).slice();

  const sort = (spObj["sort"] as string) || "created_desc";
  items.sort((a, b) => {
    const aA = Array.isArray(a.feedback_analyses) ? a.feedback_analyses[0] : a.feedback_analyses;
    const bA = Array.isArray(b.feedback_analyses) ? b.feedback_analyses[0] : b.feedback_analyses;
    if (sort === "severity_desc") return (bA?.severity_score ?? 0) - (aA?.severity_score ?? 0);
    if (sort === "severity_asc") return (aA?.severity_score ?? 0) - (bA?.severity_score ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground">
          Team triage
        </span>
        <h1 className="text-3xl font-semibold leading-tight text-foreground">Feedback inbox</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Prioritise and action every customer signal. Filter by sentiment, severity, status, and
          topic to keep the response queue under control.
        </p>
      </header>

      <Card className="border border-border/60 bg-background/85">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Filters</CardTitle>
          <p className="text-xs text-muted-foreground">
            Refine the inbox and press Apply to refresh results.
          </p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-12 md:items-end">
            <div className="md:col-span-4">
              <label htmlFor="q" className="text-xs font-medium uppercase text-muted-foreground">
                Keyword
              </label>
              <Input
                id="q"
                name="q"
                placeholder="Summary or raw content"
                defaultValue={(spObj["q"] as string) || ""}
              />
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="sentiment"
                className="text-xs font-medium uppercase text-muted-foreground"
              >
                Sentiment
              </label>
              <select
                id="sentiment"
                name="sentiment"
                defaultValue={(spObj["sentiment"] as string) || ""}
                className="w-full rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-sm text-foreground"
              >
                <option value="">Any sentiment</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="topic"
                className="text-xs font-medium uppercase text-muted-foreground"
              >
                Topic
              </label>
              <Input
                id="topic"
                name="topic"
                placeholder="e.g. Performance"
                defaultValue={(spObj["topic"] as string) || ""}
              />
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="status"
                className="text-xs font-medium uppercase text-muted-foreground"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={(spObj["status"] as string) || ""}
                className="w-full rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-sm text-foreground"
              >
                <option value="">Any status</option>
                <option value="New">New</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Actioned">Actioned</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="severity_min"
                className="text-xs font-medium uppercase text-muted-foreground"
              >
                Min sev
              </label>
              <Input
                id="severity_min"
                name="severity_min"
                type="number"
                min={1}
                max={5}
                placeholder="1"
                defaultValue={(spObj["severity_min"] as string) || ""}
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="severity_max"
                className="text-xs font-medium uppercase text-muted-foreground"
              >
                Max sev
              </label>
              <Input
                id="severity_max"
                name="severity_max"
                type="number"
                min={1}
                max={5}
                placeholder="5"
                defaultValue={(spObj["severity_max"] as string) || ""}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="sort" className="text-xs font-medium uppercase text-muted-foreground">
                Sort
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={(spObj["sort"] as string) || "created_desc"}
                className="w-full rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-sm text-foreground"
              >
                <option value="created_desc">Newest first</option>
                <option value="severity_desc">Severity high → low</option>
                <option value="severity_asc">Severity low → high</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <Button type="submit" className="w-full" variant="primary">
                Apply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="border border-border/60 bg-background/80">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No feedback matches the current filters. Adjust the filters or ingest new sources to
            populate the inbox.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((row) => {
            const analysis = Array.isArray(row.feedback_analyses)
              ? row.feedback_analyses[0]
              : row.feedback_analyses;
            const topics = Array.isArray(analysis?.topics) ? analysis.topics : [];
            const severity = analysis?.severity_score ?? "—";
            const highSeverity = typeof severity === "number" && severity >= 4;

            return (
              <Card
                key={row.id}
                className={cn(
                  "border border-border/60 bg-background/85 transition hover:border-border",
                  highSeverity && "border-rose-200/70 hover:border-rose-300",
                )}
              >
                <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <SentimentBadge sentiment={analysis?.sentiment} />
                      <span
                        className={cn(
                          "badge border-transparent bg-[color-mix(in_oklab,var(--accent)_20%,transparent)] text-foreground",
                          highSeverity && "bg-rose-100 text-rose-600",
                        )}
                      >
                        Severity {severity}
                      </span>
                      <StatusBadge status={analysis?.status} />
                    </div>
                    <div className="space-y-3">
                      <Link
                        className="text-lg font-semibold text-foreground underline decoration-dotted underline-offset-4 transition hover:decoration-solid"
                        href={`/feedback/${row.id}`}
                      >
                        {analysis?.summary || row.raw_content?.slice(0, 120) || "Untitled feedback"}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {row.raw_content}
                      </p>
                    </div>
                    {topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {topics.map((topic) => (
                          <span
                            key={topic}
                            className="badge bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-foreground/90 border-transparent"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-3 text-xs text-muted-foreground lg:items-end">
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-2">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Captured (UTC)
                      </p>
                      <p className="mt-1 text-sm text-foreground" suppressHydrationWarning>
                        {formatDateUTC(row.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/feedback/${row.id}`}
                      className="text-sm font-medium text-foreground underline decoration-dotted underline-offset-4"
                    >
                      View detail
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
