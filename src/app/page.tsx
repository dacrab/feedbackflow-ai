import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRightIcon, ChartBarIcon, DownloadIcon, FilterIcon } from "@/components/ui/icons";

const features = [
  {
    icon: DownloadIcon,
    title: "Daily ingest",
    description:
      "Pull fresh public feedback or GitHub issues automatically with retries and idempotency.",
  },
  {
    icon: ChartBarIcon,
    title: "Structured analysis",
    description:
      "LLM sentiment, topic clustering, severity scoring, and an executive-ready summary per item.",
  },
  {
    icon: FilterIcon,
    title: "Actionable triage",
    description:
      "Inbox filters, severity pivots, and status workflows keep teams aligned on what matters most.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[12%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.16),_transparent_65%)] blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.12),_transparent_65%)] blur-3xl" />
        <div className="absolute -right-40 top-[35%] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(147,51,234,0.12),_transparent_65%)] blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-6 pb-24 pt-24 text-center sm:px-10">
        <span className="rounded-full border border-border/60 bg-[color-mix(in_oklab,var(--background)_88%,transparent)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          FeedbackFlow AI
        </span>
        <h1 className="mt-8 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          The modern command center for customer feedback intelligence
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          Consolidate every public review or issue, let LLMs surface sentiment and severity, and
          route action to the right teams without spreadsheets or manual tagging.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-transparent bg-[var(--accent)] px-6 text-sm font-medium text-[var(--accent-foreground)] shadow-lg shadow-[rgba(37,99,235,0.25)] transition hover:shadow-xl"
          >
            Create your workspace <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-[color-mix(in_oklab,var(--background)_88%,transparent)] px-6 text-sm font-medium text-foreground transition hover:border-border"
          >
            Already onboard? Sign in
          </Link>
        </div>

        <div className="mt-14 grid w-full gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="h-full border-border/60">
                <CardHeader className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--accent)_12%,var(--background))] text-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="text-sm font-semibold text-foreground">{feature.title}</div>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 grid w-full gap-6 rounded-3xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_92%,transparent)] p-8 text-left shadow-[0_45px_90px_rgba(15,23,42,0.12)] sm:grid-cols-2 sm:p-10">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Built for product & customer teams
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              FeedbackFlow AI ingests what customers are saying, enriches each signal with
              structured intelligence, and gives teams an inbox built for prioritization. Deploy on
              Neon + Vercel with scheduled cron jobs in minutes.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="badge">01</span>
                Connect a public source (GitHub, Trustpilot, app stores)
              </li>
              <li className="flex items-center gap-3">
                <span className="badge">02</span>
                Daily cron ingests and analyzes sentiment, topic, severity
              </li>
              <li className="flex items-center gap-3">
                <span className="badge">03</span>
                Triage and notify teams with filters, statuses, and webhooks
              </li>
            </ul>
          </div>
          <div className="grid gap-4 text-sm">
            <Card className="border-border/50">
              <CardHeader className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Momentum snapshot
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer sentiment</span>
                  <span className="font-medium text-foreground">62% positive</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">High severity alerts</span>
                  <span className="font-medium text-foreground">12 this week</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Top topic</span>
                  <span className="font-medium text-foreground">Performance & reliability</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Deployment ready
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Auth.js sessions backed by Neon Postgres.</p>
                <p>Serverless ingest pipeline with retries, logging, and dedupe.</p>
                <p>UI built with Next.js App Router, streaming data, and charts.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
