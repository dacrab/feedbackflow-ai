import {
  IconArrowRight,
  IconBolt,
  IconBrandGithub,
  IconChartBar,
  IconFilter,
  IconMoodSmile,
  IconShieldCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerSession } from "@/lib/api";

export default async function LandingPage() {
  const session = await getServerSession();
  const loggedIn = !!session?.user?.id;

  return (
    <div className="min-h-screen bg-background font-mono selection:bg-foreground/10">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <Logo />
            <span className="font-medium tracking-tight">feedbackflow</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <ThemeToggle />
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-foreground px-3.5 py-1.5 text-xs text-background hover:bg-foreground/90 transition-colors"
              >
                dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors"
                >
                  log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-foreground px-3.5 py-1.5 text-xs text-background hover:bg-foreground/90 transition-colors"
                >
                  get started →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-4 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-background)_70%)]" />

        <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              now with multi-provider LLM support
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08]">
              Your feedback,
              <br />
              <span className="bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
                analyzed & triaged
              </span>
              <br />
              automatically.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Ingest GitHub issues, reviews, and tickets. AI extracts sentiment, severity, and
              topics — so you focus on what actually matters.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-all hover:shadow-lg"
              >
                start for free <IconArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/dacrab/feedbackflow-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 text-sm hover:bg-muted transition-colors"
              >
                <IconBrandGithub className="h-4 w-4" />
                star on GitHub
              </a>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              No credit card · Setup in 2 minutes · Works with any GitHub repo
            </p>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-xl border border-border bg-card shadow-xl shadow-black/[0.03] dark:shadow-black/20 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1.5 rounded bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <IconShieldCheck className="h-3 w-3" />
                  app.feedbackflow.dev/dashboard
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8 space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric label="total analyzed" value="1,247" change="+38 this week" up />
                <Metric label="positive rate" value="64%" change="+3% vs last month" up />
                <Metric label="critical items" value="12" change="needs attention" />
                <Metric label="avg severity" value="2.4" change="out of 5" />
              </div>

              {/* Inbox preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">// recent feedback</span>
                  <div className="flex gap-1.5">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">all</span>
                    <span className="rounded px-2 py-0.5 text-xs text-muted-foreground">
                      critical
                    </span>
                    <span className="rounded px-2 py-0.5 text-xs text-muted-foreground">
                      unread
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border divide-y divide-border">
                  <FeedbackRow
                    summary="Build fails with turbopack on monorepo"
                    sentiment="negative"
                    severity={5}
                    topics={["bug", "turbopack"]}
                    time="2h"
                  />
                  <FeedbackRow
                    summary="Request: partial prerendering in pages router"
                    sentiment="neutral"
                    severity={2}
                    topics={["feature-request"]}
                    time="5h"
                  />
                  <FeedbackRow
                    summary="Amazing DX improvements in v15.1 release"
                    sentiment="positive"
                    severity={1}
                    topics={["praise", "dx"]}
                    time="8h"
                  />
                  <FeedbackRow
                    summary="Memory leak in dev server after repeated HMR"
                    sentiment="negative"
                    severity={4}
                    topics={["bug", "performance"]}
                    time="1d"
                  />
                  <FeedbackRow
                    summary="Docs unclear on middleware edge runtime"
                    sentiment="neutral"
                    severity={3}
                    topics={["docs", "middleware"]}
                    time="1d"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs text-muted-foreground mb-6">
            built for teams that ship fast
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground/60">
            <span className="text-sm font-medium">indie hackers</span>
            <span className="text-sm font-medium">open source maintainers</span>
            <span className="text-sm font-medium">product teams</span>
            <span className="text-sm font-medium">devrel</span>
            <span className="text-sm font-medium">support leads</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-xs text-muted-foreground mb-3">// capabilities</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything to go from noise to signal
            </h2>
            <p className="mt-3 text-muted-foreground">
              One tool to ingest, analyze, and act on all your public feedback.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<IconBolt className="h-5 w-5" />}
              title="Automated ingestion"
              desc="Connect GitHub repos. New issues are fetched on a schedule, deduplicated, and queued for analysis."
            />
            <Feature
              icon={<IconMoodSmile className="h-5 w-5" />}
              title="Multi-model AI analysis"
              desc="Choose OpenAI, Anthropic, or Google. Each item gets sentiment, severity, topics, and a summary."
            />
            <Feature
              icon={<IconFilter className="h-5 w-5" />}
              title="Filterable inbox"
              desc="Sort by severity, filter by sentiment or topic, search by keyword. Find what needs attention fast."
            />
            <Feature
              icon={<IconChartBar className="h-5 w-5" />}
              title="Trend dashboard"
              desc="Visualize sentiment over time, topic distribution, and severity breakdown at a glance."
            />
            <Feature
              icon={<IconShieldCheck className="h-5 w-5" />}
              title="Per-user isolation"
              desc="All data is scoped to your account. Row-level security ensures complete data separation."
            />
            <Feature
              icon={<IconBrandGithub className="h-5 w-5" />}
              title="Slack & webhook alerts"
              desc="Get notified instantly when high-severity feedback lands. Configure per-source thresholds."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-border bg-muted/20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <p className="text-xs text-muted-foreground mb-3">// workflow</p>
            <h2 className="text-3xl font-semibold tracking-tight">Three steps to clarity</h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border" />

            <div className="grid gap-12 sm:gap-8 sm:grid-cols-3">
              <StepCard
                n="01"
                title="Connect sources"
                desc="Add a GitHub repo URL in settings. We'll start fetching issues immediately."
              />
              <StepCard
                n="02"
                title="AI does the work"
                desc="Each new item is analyzed for sentiment, severity (1-5), and topic tags automatically."
              />
              <StepCard
                n="03"
                title="Triage & act"
                desc="Review your inbox, mark items as actioned, and get Slack pings for critical ones."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Stop reading every issue manually.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Let AI handle the triage. You handle the decisions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-all"
            >
              get started free <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free tier available · No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo />
            <span>feedbackflow © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/dacrab/feedbackflow-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span>next.js · neon · ai sdk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --- Helper Components --- */

function Metric({
  label,
  value,
  change,
  up,
}: {
  label: string;
  value: string;
  change: string;
  up?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className={`text-xs mt-1 ${up ? "text-green-500" : "text-muted-foreground"}`}>{change}</p>
    </div>
  );
}

function FeedbackRow({
  summary,
  sentiment,
  severity,
  topics,
  time,
}: {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  severity: number;
  topics: string[];
  time: string;
}) {
  const dot =
    severity >= 4 ? "bg-red-500" : severity >= 3 ? "bg-orange-400" : "bg-muted-foreground/30";
  const badge =
    sentiment === "positive"
      ? "bg-green-500/10 text-green-600 dark:text-green-400"
      : sentiment === "negative"
        ? "bg-red-500/10 text-red-600 dark:text-red-400"
        : "bg-muted text-muted-foreground";

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
      <span className="flex-1 text-sm truncate">{summary}</span>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${badge}`}>{sentiment}</span>
      <span className="shrink-0 text-xs text-muted-foreground hidden md:inline">
        {topics.map((t) => `[${t}]`).join(" ")}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground w-8 text-right">{time}</span>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-muted-foreground/20">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-foreground mb-4 transition-colors group-hover:bg-foreground group-hover:text-background">
        {icon}
      </div>
      <h3 className="font-medium tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-sm font-medium shadow-sm mb-4">
        {n}
      </div>
      <h3 className="font-medium tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
