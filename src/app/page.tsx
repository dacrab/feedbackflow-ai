import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ArrowRightIcon, ChartBarIcon, DownloadIcon, FilterIcon } from "@/components/ui/icons";
import { createServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supa = await createServerClient();
  const { data } = await supa.auth.getUser();
  if (data.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-4xl p-8 text-center">
        <p className="uppercase tracking-widest text-xs text-muted">
          Monochrome • Minimal • Focused
        </p>
        <h1 className="mt-4 text-4xl md:text-6xl font-semibold">
          FeedbackFlow <span className="text-muted-foreground">AI</span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">
          Ingest public feedback, analyze with LLMs, and triage what matters — all in one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 px-5 rounded-md border border-border text-foreground hover:bg-background"
          >
            Sign in <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-10 px-5 rounded-md border border-border bg-foreground text-background hover:opacity-90"
          >
            Create account <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-sm">
          <Card>
            <div className="font-medium inline-flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" /> Ingest
            </div>
            <p className="mt-1 text-muted-foreground">GitHub issues daily with idempotent cron.</p>
          </Card>
          <Card>
            <div className="font-medium inline-flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" /> Analyze
            </div>
            <p className="mt-1 text-muted-foreground">LLM sentiment, topics, severity, summary.</p>
          </Card>
          <Card>
            <div className="font-medium inline-flex items-center gap-2">
              <FilterIcon className="h-4 w-4" /> Triage
            </div>
            <p className="mt-1 text-muted-foreground">Filters, charts, and status workflow.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
