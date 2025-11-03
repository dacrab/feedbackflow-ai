import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-background/90">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] px-12 py-16 text-left shadow-[inset_-1px_0_0_rgba(148,163,184,0.18)] lg:flex">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            FeedbackFlow
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[color-mix(in_oklab,var(--accent)_80%,var(--accent-foreground))]" />
          </Link>
          <h1 className="mt-10 text-4xl font-semibold leading-tight text-foreground">
            Clarity for product & customer teams.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground">
            Bring every public review, issue, and comment into a single, LLM-powered workspace. Spot severity spikes, align ownership, and automate notifications with confidence.
          </p>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_90%,transparent)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Why teams switch</p>
            <ul className="mt-4 space-y-2">
              <li>• Structured sentiment, topics, and severity in minutes.</li>
              <li>• Cron-based ingest with retry, dedupe, and logging.</li>
              <li>• Slack/webhook alerts for severity ≥ 4 without glue code.</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground/80">
            Powered by Supabase Auth, Postgres, and Edge Functions. Deploy anywhere Next.js runs.
          </p>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 bottom-12 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_65%)] blur-3xl" />
          <div className="absolute -right-28 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.16),_transparent_65%)] blur-3xl" />
        </div>
      </div>
      <div className="relative flex min-h-screen w-full flex-col justify-center px-6 py-12 sm:px-10 lg:max-w-md">
        <div className="mx-auto w-full max-w-sm space-y-10">
          {children}
        </div>
      </div>
    </div>
  );
}

