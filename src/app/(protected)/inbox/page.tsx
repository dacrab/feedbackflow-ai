import { cookies, headers } from "next/headers";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Input from "@/components/ui/input";

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <Card className="max-w-5xl mx-auto">
        <form className="grid md:grid-cols-7 gap-2">
          <Input name="q" placeholder="Search" defaultValue={(spObj["q"] as string) || ""} />
          <select
            name="sentiment"
            defaultValue={(spObj["sentiment"] as string) || ""}
            className="w-full rounded-md border border-border bg-input text-foreground px-3 py-2"
          >
            <option value="">Any sentiment</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
          <Input name="topic" placeholder="Topic" defaultValue={(spObj["topic"] as string) || ""} />
          <select
            name="status"
            defaultValue={(spObj["status"] as string) || ""}
            className="w-full rounded-md border border-border bg-input text-foreground px-3 py-2"
          >
            <option value="">Any status</option>
            <option value="New">New</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Actioned">Actioned</option>
          </select>
          <Input
            name="severity_min"
            type="number"
            min={1}
            max={5}
            placeholder="Min sev"
            defaultValue={(spObj["severity_min"] as string) || ""}
          />
          <Input
            name="severity_max"
            type="number"
            min={1}
            max={5}
            placeholder="Max sev"
            defaultValue={(spObj["severity_max"] as string) || ""}
          />
          <select
            name="sort"
            defaultValue={(spObj["sort"] as string) || "created_desc"}
            className="w-full rounded-md border border-border bg-input text-foreground px-3 py-2"
          >
            <option value="created_desc">Newest</option>
            <option value="severity_desc">Severity high→low</option>
            <option value="severity_asc">Severity low→high</option>
          </select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto max-w-5xl mx-auto">
        <table className="table text-sm no-header-bg">
          <thead className="bg-transparent">
            <tr>
              <th>Created</th>
              <th>Summary</th>
              <th>Sentiment</th>
              <th>Severity</th>
              <th>Topics</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const a = Array.isArray(row.feedback_analyses)
                ? row.feedback_analyses[0]
                : row.feedback_analyses;
              return (
                <tr key={row.id}>
                  <td className="whitespace-nowrap">
                    <span suppressHydrationWarning>{formatDateUTC(row.created_at)}</span>
                  </td>
                  <td>
                    <Link
                      className="underline decoration-dotted hover:decoration-solid"
                      href={`/feedback/${row.id}`}
                    >
                      {a?.summary || row.raw_content?.slice(0, 80)}
                    </Link>
                  </td>
                  <td>{a?.sentiment}</td>
                  <td>{a?.severity_score}</td>
                  <td>{Array.isArray(a?.topics) ? a.topics.join(", ") : ""}</td>
                  <td>{a?.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
