import { ArrowRight, BarChart3, Bell, Brain, Github, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Zap className="h-4 w-4" />
            </div>
            <span>FeedbackFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Now with GitHub Issues integration
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Turn feedback into
              <span className="block text-muted-foreground">actionable insights</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Automatically ingest, analyze, and triage customer feedback using AI. Identify
              critical issues before they escalate.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="https://github.com"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 rounded-2xl border border-border bg-card p-8">
            <div className="text-center">
              <div className="text-4xl font-bold">10x</div>
              <div className="mt-1 text-sm text-muted-foreground">Faster triage</div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-4xl font-bold">95%</div>
              <div className="mt-1 text-sm text-muted-foreground">Accuracy rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">24/7</div>
              <div className="mt-1 text-sm text-muted-foreground">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-3 text-muted-foreground">
              Powerful features to help you understand your customers better
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Brain}
              title="AI Analysis"
              description="Automatic sentiment analysis, topic classification, and severity scoring powered by advanced LLMs."
            />
            <FeatureCard
              icon={BarChart3}
              title="Real-time Dashboard"
              description="Visualize trends, track sentiment shifts, and identify patterns in your feedback data."
            />
            <FeatureCard
              icon={Bell}
              title="Smart Alerts"
              description="Get notified instantly when high-severity issues are detected via Slack webhooks."
            />
            <FeatureCard
              icon={Github}
              title="GitHub Integration"
              description="Automatically ingest issues from your GitHub repositories for analysis."
            />
            <FeatureCard
              icon={Zap}
              title="Automated Ingest"
              description="Daily cron jobs fetch and process new feedback automatically."
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Private"
              description="Your data is encrypted and never shared. Self-host or use our cloud."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl bg-foreground p-12 text-center text-background">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-3 text-background/70">
              Start analyzing your feedback in minutes. No credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background">
                <Zap className="h-3 w-3" />
              </div>
              <span>FeedbackFlow</span>
            </div>
            <div>Built with Next.js, Neon, and AI</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-border/80 hover:bg-muted/30">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
