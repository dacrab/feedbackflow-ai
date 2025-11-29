import { ChevronDown, Filter, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FeedbackFilters } from "@/components/inbox/feedback-filters";
import { Button } from "@/components/ui/button";
import { SentimentBadge } from "@/components/ui/sentiment-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFeedbackItems } from "@/lib/services/feedback-service";
import { filterFeedbackItems, parseFeedbackFilters } from "@/lib/services/query-builder";
import { formatDateUTC } from "@/lib/utils/date";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | null)?.id;
  if (!userId) redirect("/login");

  const spObj = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(spObj)) {
    if (typeof v === "string" && v) sp.set(k, v);
  }

  const filters = parseFeedbackFilters(sp);
  const allItems = await getFeedbackItems(userId, { limit: 100 });
  const filteredItems = filterFeedbackItems(allItems, filters);
  const items = filteredItems.slice();

  const sort = (spObj["sort"] as string) || "created_desc";
  items.sort((a, b) => {
    const aA = Array.isArray(a.feedback_analyses) ? a.feedback_analyses[0] : a.feedback_analyses;
    const bA = Array.isArray(b.feedback_analyses) ? b.feedback_analyses[0] : b.feedback_analyses;
    if (sort === "severity_desc") return (bA?.severity_score ?? 0) - (aA?.severity_score ?? 0);
    if (sort === "severity_asc") return (aA?.severity_score ?? 0) - (bA?.severity_score ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
          <p className="text-muted-foreground mt-1">Triage and manage incoming feedback.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-border/60 shadow-sm bg-background/50 backdrop-blur-sm"
          >
            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Save View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-border/60 shadow-sm bg-background/50 backdrop-blur-sm"
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Display
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-10 bg-muted/5 backdrop-blur-xl border-b border-border/40 -mx-8 px-8 py-3 shadow-sm flex items-center justify-between">
        <FeedbackFilters />
        <div className="text-xs text-muted-foreground font-medium">{items.length} results</div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/30 hover:bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-[120px] pl-6">Status</TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead className="w-[120px]">Sentiment</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead className="w-[80px] text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <Filter className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p>No results found matching your filters.</p>
                      <Button variant="link" size="sm" className="text-primary">
                        Clear all filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const analysis = Array.isArray(item.feedback_analyses)
                    ? item.feedback_analyses[0]
                    : item.feedback_analyses;
                  const severity = analysis?.severity_score ?? 0;

                  return (
                    <TableRow
                      key={item.id}
                      className="group border-border/40 hover:bg-muted/40 transition-all cursor-pointer h-[72px]"
                    >
                      <TableCell className="pl-6">
                        <StatusBadge status={analysis?.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ring-2 ring-background ${severity >= 4 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : severity >= 3 ? "bg-orange-500" : "bg-muted-foreground/30"}`}
                          />
                          <span className="font-medium text-sm tabular-nums">{severity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <SentimentBadge sentiment={analysis?.sentiment} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 py-1 max-w-[600px]">
                          <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {analysis?.summary || "No summary available"}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate max-w-[300px] opacity-80">
                              {item.raw_content}
                            </span>
                            {analysis?.topics && analysis.topics.length > 0 && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <div className="flex gap-1">
                                  {analysis.topics.slice(0, 2).map((t) => (
                                    <span
                                      key={t}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/5 text-primary/80"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                  {analysis.topics.length > 2 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{analysis.topics.length - 2}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium text-right tabular-nums">
                        {formatDateUTC(item.created_at)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Link href={`/feedback/${item.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-background hover:shadow-sm border border-transparent hover:border-border/50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <ChevronDown className="h-4 w-4 -rotate-90" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
