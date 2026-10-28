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
import type { ComponentType } from "react";
import { Brand, Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ButtonLink,
  ExternalLink,
  Eyebrow,
  MetricCard,
  Muted,
  Rows,
  SentimentBadge,
  SeverityChip,
} from "@/components/ui/ui";
import { APP_NAME, HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import type { Sentiment } from "@/lib/types";
import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com/dacrab/feedbackflow-ai";

export function SiteNav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <nav className="border-border bg-background/80 fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Brand href="/" className="font-medium tracking-tight" />
        <div className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          {loggedIn ? (
            <ButtonLink href="/dashboard" variant="primary" className="px-3.5 py-1.5 text-xs">
              dashboard →
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground hidden transition-colors sm:inline"
              >
                log in
              </Link>
              <ButtonLink href="/signup" variant="primary" className="px-3.5 py-1.5 text-xs">
                get started →
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function Cta({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ButtonLink
      href={href}
      variant="primary"
      size="lg"
      className={cn("justify-center gap-2 font-medium", className)}
    >
      {children}
    </ButtonLink>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-4">
      <div className="absolute inset-0 bg-[size:4rem_4rem] bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-background)_70%)]" />

      <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-20">
        <div className="animate-fade-up mx-auto max-w-3xl text-center [animation-fill-mode:both]">
          <div className="border-border bg-card text-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            free tier via OpenRouter — no credit card needed
          </div>

          <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Your feedback,
            <br />
            <span className="from-chart-1 to-chart-2 bg-gradient-to-r bg-clip-text text-transparent">
              analyzed &amp; triaged
            </span>
            <br />
            automatically.
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
            Ingest GitHub issues. AI extracts sentiment, severity, and topics — so you focus on what
            actually matters.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Cta href="/signup" className="w-full sm:w-auto">
              start for free <IconArrowRight className="size-4" />
            </Cta>
            <ExternalLink
              href={GITHUB_URL}
              className="border-border hover:bg-muted inline-flex w-full items-center justify-center gap-2 rounded border px-6 py-3 text-sm no-underline sm:w-auto"
            >
              <IconBrandGithub className="size-4" />
              view on GitHub
            </ExternalLink>
          </div>

          <Muted className="mt-4 block">
            No credit card · Setup in 2 minutes · Works with any GitHub repo
          </Muted>
        </div>
      </div>
    </section>
  );
}

interface SampleFeedback {
  summary: string;
  sentiment: Sentiment;
  severity: number;
  topics: string[];
  time: string;
}

const SAMPLE_FEEDBACK: SampleFeedback[] = [
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

function SampleRow({ summary, sentiment, severity, topics, time }: SampleFeedback) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <SeverityChip score={severity} className="w-4 shrink-0" />
      <span className="flex-1 truncate text-sm">{summary}</span>
      <SentimentBadge sentiment={sentiment} className="shrink-0" />
      <Muted className="hidden shrink-0 md:inline">{topics.map((t) => `[${t}]`).join(" ")}</Muted>
      <Muted className="shrink-0 text-right">{time}</Muted>
    </div>
  );
}

export function AppPreview() {
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-border bg-card overflow-hidden rounded-xl border shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-4 py-2.5">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted-foreground/20 size-2.5 rounded-full" />
              ))}
            </div>
            <div className="flex flex-1 justify-center">
              <Muted>{APP_NAME.toLowerCase()} / dashboard</Muted>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            <div>
              <Eyebrow className="mb-2">sample data</Eyebrow>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <MetricCard label="total" value="1,247" delta={38} />
                <MetricCard label="positive" value="64%" />
                <MetricCard
                  label="critical"
                  value="12"
                  note={`severity ${HIGH_SEVERITY_THRESHOLD}+`}
                />
                <MetricCard label="avg severity" value="2.4" note={`of ${MAX_SEVERITY}`} />
              </div>
            </div>

            <div>
              <Eyebrow className="mb-2">feedback items</Eyebrow>
              <Rows>
                {SAMPLE_FEEDBACK.map((row) => (
                  <SampleRow key={row.summary} {...row} />
                ))}
              </Rows>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface Feature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    icon: IconBolt,
    title: "Automated ingestion",
    desc: "Connect GitHub repos. New issues are fetched on a schedule, deduplicated, and queued for analysis.",
  },
  {
    icon: IconMoodSmile,
    title: "Multi-model AI analysis",
    desc: "Use OpenRouter (free), OpenAI, Anthropic, or Google. Each item gets sentiment, severity, topics, and a summary.",
  },
  {
    icon: IconFilter,
    title: "Filterable inbox",
    desc: "Sort by severity, filter by sentiment or topic, search by keyword. Find what needs attention fast.",
  },
  {
    icon: IconChartBar,
    title: "Trend dashboard",
    desc: "Visualize sentiment over time, topic distribution, and severity breakdown at a glance.",
  },
  {
    icon: IconShieldCheck,
    title: "Per-user isolation",
    desc: "All data is scoped to your account. Every query is filtered by your user id for complete separation.",
  },
  {
    icon: IconBrandGithub,
    title: "Slack alerts",
    desc: "Get notified instantly when high-severity feedback lands. Configure per-source thresholds.",
  },
];

function FeatureCard({ icon: Icon, title, desc }: Feature) {
  // Not `Card`, which renders a `// title` eyebrow this surface does not have.
  return (
    <div className="border-border bg-card hover:border-muted-foreground/30 rounded border p-5 transition-colors">
      <div className="bg-muted/60 text-muted-foreground mb-3 flex size-8 items-center justify-center rounded">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-medium tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

export function Features() {
  return (
    <section className="border-border border-t py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <Eyebrow className="mb-2">capabilities</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything to go from noise to signal
          </h2>
          <p className="text-muted-foreground mt-3">
            One tool to ingest, analyze, and act on all your public feedback.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-border border-t py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Stop reading every issue manually.
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md">
          Let AI handle the triage. You handle the decisions.
        </p>
        <div className="mt-8">
          <Cta href="/signup">
            get started free <IconArrowRight className="size-4" />
          </Cta>
        </div>
        <Muted className="mt-3 block">Free tier available · No credit card required</Muted>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-border border-t py-6">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <span>
            {APP_NAME.toLowerCase()} © {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <ExternalLink href={GITHUB_URL} className="hover:text-foreground no-underline">
            GitHub
          </ExternalLink>
          <span>next.js · neon · openrouter · vercel</span>
        </div>
      </div>
    </footer>
  );
}
