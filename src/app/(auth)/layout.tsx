import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { Brand } from "@/components/logo";
import { Eyebrow } from "@/components/ui/ui";

const FEATURES = [
  "ingest GitHub issues automatically, deduplicated daily",
  "AI extracts sentiment, severity (1–5), and topic tags",
  "filter and triage your inbox by what actually matters",
  "Slack alerts for critical feedback, free via OpenRouter",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="animate-slide-right bg-foreground text-background hidden flex-col p-8 [animation-fill-mode:both] lg:flex lg:w-1/2">
        <Brand href="/" logoClassName="invert" className="text-inverse-muted" />

        <div className="flex flex-1 items-center">
          <div className="w-full space-y-6">
            <div>
              <Eyebrow className="text-inverse-subtle mb-4">what you get</Eyebrow>
              <div className="space-y-4 text-sm">
                {FEATURES.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <span className="text-inverse-accent mt-0.5">→</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-inverse-subtle text-xs">next.js + neon + llm</div>
      </div>

      <main className="animate-fade-up bg-background flex flex-1 flex-col p-8 [animation-delay:100ms] [animation-fill-mode:both]">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm"
        >
          <IconArrowLeft className="size-3.5" />
          back
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex justify-center lg:hidden">
              <Brand href="/" />
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
