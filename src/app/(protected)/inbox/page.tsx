import { cookies, headers } from "next/headers";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Input from "@/components/ui/input";
import { cn } from "@/lib/cn";

type AnalysisRow = {
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
  severity_score: number;
  summary: string;
  status: "New" | "Acknowledged" | "Actioned";
};

type ItemRow = {
  id: string;
  created_at: string;
  raw_content: string;
  feedback_analyses: AnalysisRow[] | AnalysisRow | null;
};

function formatDateUTC(iso: string) {
  const dt = new Date(iso);
  try {
    return dt.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return dt.toISOString();
  }
}

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
  const items = (data.items as ItemRow[]).slice();

  const sort = (spObj["sort"] as string) || "created_desc";
  items.sort((a, b) => {
    const aA = Array.isArray(a.feedback_analyses) ? a.feedback_analyses[0] : a.feedback_analyses;
    const bA = Array.isArray(b.feedback_analyses) ? b.feedback_analyses[0] : b.feedback_analyses;
    if (sort === "severity_desc") return (bA?.severity_score ?? 0) - (aA?.severity_score ?? 0);
    if (sort === "severity_asc") return (aA?.severity_score ?? 0) - (bA?.severity_score ?? 0);
    // default created_at desc
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  function sentimentBadge(sentiment?: string | null) {
    if (!sentiment) return null;
    const styles: Record<string, string> = {
      positive: "bg-[rgba(34,197,94,0.16)] text-emerald-600 border-transparent",
      neutral: "bg-[rgba(148,163,184,0.14)] text-slate-600 border-transparent",
      negative: "bg-[rgba(239,68,68,0.16)] text-rose-600 border-transparent",
    };
    return <span className={cn("badge capitalize", styles[sentiment] ?? "")}>{sentiment}</span>;
  }

  function statusBadge(status?: string | null) {
    if (!status) return null;
    const styles: Record<string, string> = {
      New: "bg-[rgba(37,99,235,0.12)] text-blue-600 border-transparent",
      Acknowledged: "bg-[rgba(234,179,8,0.16)] text-amber-600 border-transparent",
      Actioned: "bg-[rgba(16,185,129,0.16)] text-emerald-600 border-transparent",
    };
    return <span className={cn("badge", styles[status] ?? "")}>{status}</span>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Feedback inbox</h1>
        <p className="text-sm text-muted-foreground">
          Filter, prioritize, and assign triage status across every ingested feedback item.
        </p>
      </div>

      <Card className="mx-auto w-full max-w-6xl border-border/60 bg-[color-mix(in_oklab,var(--background)_95%,transparent)]">
        <form className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Keyword search
            </label>
            <Input name="q" placeholder="Search summary or raw content" defaultValue={(spObj["q"] as string) || ""} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Sentiment</label>
            <select
              name="sentiment"
              defaultValue={(spObj["sentiment"] as string) || ""}
              className="w-full rounded-xl border border-border/70 bg-[color-mix(in_oklab,var(--background)_90%,transparent)] px-3.5 py-2.5 text-sm text-foreground"
            >
              <option value="">Any sentiment</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Topic</label>
            <Input name="topic" placeholder="e.g. Performance" defaultValue={(spObj["topic"] as string) || ""} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Status</label>
            <select
              name="status"
              defaultValue={(spObj["status"] as string) || ""}
              className="w-full rounded-xl border border-border/70 bg-[color-mix(in_oklab,var(--background)_90%,transparent)] px-3.5 py-2.5 text-sm text-foreground"
            >
              <option value="">Any status</option>
              <option value="New">New</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Actioned">Actioned</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Min sev</label>
            <Input
              name="severity_min"
              type="number"
              min={1}
              max={5}
              placeholder="1"
              defaultValue={(spObj["severity_min"] as string) || ""}
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Max sev</label>
            <Input
              name="severity_max"
              type="number"
              min={1}
              max={5}
              placeholder="5"
              defaultValue={(spObj["severity_max"] as string) || ""}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Sort</label>
            <select
              name="sort"
              defaultValue={(spObj["sort"] as string) || "created_desc"}
              className="w-full rounded-xl border border-border/70 bg-[color-mix(in_oklab,var(--background)_90%,transparent)] px-3.5 py-2.5 text-sm text-foreground"
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
      </Card>

      <Card className="mx-auto w-full max-w-6xl overflow-hidden border-border/60">
        <div className="overflow-x-auto">
          <table className="table text-sm">
            <thead>
              <tr>
                <th className="min-w-[140px]">Created (UTC)</th>
                <th className="min-w-[260px]">Summary</th>
                <th className="min-w-[120px]">Sentiment</th>
                <th className="min-w-[100px]">Severity</th>
                <th className="min-w-[200px]">Topics</th>
                <th className="min-w-[140px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const a = Array.isArray(row.feedback_analyses)
                  ? row.feedback_analyses[0]
                  : row.feedback_analyses;
                const topics = Array.isArray(a?.topics) ? a.topics : [];
                return (
                  <tr key={row.id} className="align-top">
                    <td className="whitespace-nowrap text-xs text-muted-foreground">
                      <span suppressHydrationWarning>{formatDateUTC(row.created_at)}</span>
                    </td>
                    <td>
                      <Link
                        className="font-medium text-foreground underline decoration-dotted underline-offset-4 transition hover:decoration-solid"
                        href={`/feedback/${row.id}`}
                      >
                        {a?.summary || row.raw_content?.slice(0, 120)}
                      </Link>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {row.raw_content}
                      </p>
                    </td>
                    <td>{sentimentBadge(a?.sentiment)}</td>
                    <td>
                      <span className="badge bg-[rgba(37,99,235,0.08)] text-foreground">
                        {a?.severity_score ?? "—"}
                      </span>
                    </td>
                    <td>
                      {topics.length ? (
                        <div className="flex flex-wrap gap-1">
                          {topics.map((topic) => (
                            <span
                              key={topic}
                              className="badge bg-[rgba(148,163,184,0.12)] text-slate-600 border-transparent"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>{statusBadge(a?.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
