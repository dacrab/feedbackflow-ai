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
import { Eyebrow, MetricCard, Muted } from "@/components/ui/ui";
import { getServerSession } from "@/lib/api";
import { sentimentColor, sevColor } from "@/lib/utils";

export default async function LandingPage() {
  const session = await getServerSession();
  const loggedIn = !!session?.user?.id;

  return (
    <div className="min-h-screen bg-background font-mono selection:bg-foreground/10">
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
                className="rounded bg-foreground px-3.5 py-1.5 text-xs text-background hover:bg-foreground/90 transition-colors"
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
                  className="rounded bg-foreground px-3.5 py-1.5 text-xs text-background hover:bg-foreground/90 transition-colors"
                >
                  get started →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative pt-28 pb-4 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-background)_70%)]" />

        <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-20">
          <div className="max-w-3xl mx-auto text-center animate-fade-up [animation-fill-mode:both]">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              free tier via OpenRouter — no credit card needed
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
              Ingest GitHub issues. AI extracts sentiment, severity, and topics — so you focus on
              what actually matters.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <CtaLink href="/signup" className="w-full sm:w-auto">
                start for free <IconArrowRight className="h-4 w-4" />
              </CtaLink>
              <a
                href="https://github.com/dacrab/feedbackflow-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded border border-border px-6 py-3 text-sm hover:bg-muted transition-colors"
              >
                <IconBrandGithub className="h-4 w-4" />
                view on GitHub
              </a>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              No credit card · Setup in 2 minutes · Works with any GitHub repo
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                ))}
              </div>
              <div className="flex-1 flex justify-center">
                <Muted>feedbackflow / dashboard</Muted>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <Eyebrow className="mb-2">overview</Eyebrow>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <MetricCard label="total" value="1,247" delta={38} />
                  <MetricCard label="positive" value="64%" />
                  <MetricCard label="critical" value="12" note="severity 4+" />
                  <MetricCard label="avg severity" value="2.4" note="of 5" />
                </div>
              </div>

              <div>
                <Eyebrow className="mb-2">feedback items</Eyebrow>
                <div className="rounded border border-border divide-y divide-border">
                  {SAMPLE_FEEDBACK.map((f) => (
                    <FeedbackRow key={f.summary} {...f} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl mb-12">
            <Eyebrow className="mb-2">capabilities</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything to go from noise to signal
            </h2>
            <p className="mt-3 text-muted-foreground">
              One tool to ingest, analyze, and act on all your public feedback.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Feature key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Stop reading every issue manually.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Let AI handle the triage. You handle the decisions.
          </p>
          <div className="mt-8">
            <CtaLink href="/signup">
              get started free <IconArrowRight className="h-4 w-4" />
            </CtaLink>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free tier available · No credit card required
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-6">
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
            <span>next.js · neon · openrouter · vercel</span>
          </div>
        </div>
      </footer>
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
  const sc = sevColor(severity);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className={`text-xs font-mono font-medium w-4 shrink-0 ${sc}`}>{severity}</span>
      <span className="flex-1 text-sm truncate">{summary}</span>
      <span className={`shrink-0 text-xs ${sentimentColor(sentiment)}`}>{sentiment}</span>
      <span className="shrink-0 text-xs text-muted-foreground hidden md:inline">
        {topics.map((t) => `[${t}]`).join(" ")}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground w-8 text-right">{time}</span>
    </div>
  );
}

const SAMPLE_FEEDBACK: {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  severity: number;
  topics: string[];
  time: string;
}[] = [
  {
    summary: "Build fails with turbopack on monorepo",
    sentiment: "negative",
    severity: 5,
    topics: ["bug", "turbopack"],
    time: "2h",
  },
  {
    summary: "Request: partial prerendering in pages router",
    sentiment: "neutral",
    severity: 2,
    topics: ["feature-request"],
    time: "5h",
  },
  {
    summary: "Amazing DX improvements in v15.1 release",
    sentiment: "positive",
    severity: 1,
    topics: ["praise", "dx"],
    time: "8h",
  },
  {
    summary: "Memory leak in dev server after repeated HMR",
    sentiment: "negative",
    severity: 4,
    topics: ["bug", "performance"],
    time: "1d",
  },
];

const FEATURES = [
  {
    icon: <IconBolt className="h-5 w-5" />,
    title: "Automated ingestion",
    desc: "Connect GitHub repos. New issues are fetched on a schedule, deduplicated, and queued for analysis.",
  },
  {
    icon: <IconMoodSmile className="h-5 w-5" />,
    title: "Multi-model AI analysis",
    desc: "Use OpenRouter (free), OpenAI, Anthropic, or Google. Each item gets sentiment, severity, topics, and a summary.",
  },
  {
    icon: <IconFilter className="h-5 w-5" />,
    title: "Filterable inbox",
    desc: "Sort by severity, filter by sentiment or topic, search by keyword. Find what needs attention fast.",
  },
  {
    icon: <IconChartBar className="h-5 w-5" />,
    title: "Trend dashboard",
    desc: "Visualize sentiment over time, topic distribution, and severity breakdown at a glance.",
  },
  {
    icon: <IconShieldCheck className="h-5 w-5" />,
    title: "Per-user isolation",
    desc: "All data is scoped to your account. Row-level security ensures complete data separation.",
  },
  {
    icon: <IconBrandGithub className="h-5 w-5" />,
    title: "Slack alerts",
    desc: "Get notified instantly when high-severity feedback lands. Configure per-source thresholds.",
  },
];

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded border border-border bg-card p-5 hover:border-muted-foreground/30 transition-colors">
      <div className="h-8 w-8 rounded bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
        {icon}
      </div>
      <h3 className="font-medium tracking-tight text-sm">{title}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function CtaLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-all ${className}`}
    >
      {children}
    </Link>
  );
}
