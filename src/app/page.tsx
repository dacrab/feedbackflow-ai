import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-mono">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <Logo />
            <span className="font-medium">feedbackflow</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              login
            </Link>
            <Link
              href="/signup"
              className="rounded bg-foreground px-3 py-1.5 text-background hover:bg-foreground/90"
            >
              signup
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground mb-4">
              // feedback analysis for developers
            </p>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
              Stop drowning in GitHub issues.
              <br />
              <span className="text-muted-foreground">Let AI do the triage.</span>
            </h1>
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-lg">
              Ingest issues from your repos, get sentiment + severity + topics extracted
              automatically. Focus on what matters.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded bg-foreground px-4 py-2 text-sm text-background hover:bg-foreground/90"
              >
                get started <IconArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href="https://github.com/dacrab/feedbackflow-ai"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                view source →
              </a>
            </div>
          </div>

          <div className="mt-16 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">feedbackflow analysis</span>
            </div>
            <div className="p-6 text-sm space-y-4">
              <div>
                <span className="text-muted-foreground">$</span> feedbackflow analyze --repo
                vercel/next.js
              </div>
              <div className="text-muted-foreground">fetching latest issues...</div>
              <div className="border-l-2 border-border pl-4 space-y-3">
                <AnalysisItem
                  id="#58234"
                  title="Build fails with turbopack on monorepo"
                  sentiment="negative"
                  severity={4}
                  topics={["bug", "turbopack"]}
                />
                <AnalysisItem
                  id="#58231"
                  title="Add support for partial prerendering in pages router"
                  sentiment="neutral"
                  severity={2}
                  topics={["feature-request"]}
                />
                <AnalysisItem
                  id="#58229"
                  title="Great DX improvements in 15.1!"
                  sentiment="positive"
                  severity={1}
                  topics={["feedback"]}
                />
              </div>
              <div className="text-muted-foreground">
                <span className="text-green-500">✓</span> 3 issues analyzed, 1 high severity flagged
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-sm text-muted-foreground mb-8">// how it works</p>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step
              n={1}
              title="connect"
              desc="Point to any GitHub repo or paste feedback manually"
            />
            <Step n={2} title="analyze" desc="LLM extracts sentiment, topics, severity (1-5)" />
            <Step n={3} title="act" desc="Filter inbox, get Slack alerts for critical items" />
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>feedbackflow © 2026</span>
          <span>next.js + neon + llm</span>
        </div>
      </footer>
    </div>
  );
}

function AnalysisItem({
  id,
  title,
  sentiment,
  severity,
  topics,
}: {
  id: string;
  title: string;
  sentiment: "positive" | "neutral" | "negative";
  severity: number;
  topics: string[];
}) {
  const sentimentColor = {
    positive: "text-green-500",
    neutral: "text-muted-foreground",
    negative: "text-red-500",
  }[sentiment];

  return (
    <div className="space-y-1">
      <div>
        <span className="text-muted-foreground">{id}</span>{" "}
        <span className="text-foreground">{title}</span>
      </div>
      <div className="flex gap-4 text-xs">
        <span className={sentimentColor}>{sentiment}</span>
        <span>severity: {severity}/5</span>
        <span className="text-muted-foreground">[{topics.join(", ")}]</span>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-sm mb-2">0{n}</div>
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
