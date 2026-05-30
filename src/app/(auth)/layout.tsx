import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-mono">
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background p-8 flex-col animate-slide-right [animation-fill-mode:both]">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <Logo className="h-7 w-7 invert" />
          <span>feedbackflow</span>
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full space-y-6">
            <div>
              <p className="text-background/50 text-xs mb-4">// what you get</p>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">→</span>
                  <span>ingest GitHub issues automatically, deduplicated daily</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">→</span>
                  <span>AI extracts sentiment, severity (1–5), and topic tags</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">→</span>
                  <span>filter and triage your inbox by what actually matters</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">→</span>
                  <span>Slack alerts for critical feedback, free via OpenRouter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-background/40">next.js + neon + llm</div>
      </div>

      <div className="flex-1 flex flex-col p-8 bg-background animate-fade-up [animation-delay:100ms] [animation-fill-mode:both]">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <IconArrowLeft className="h-3.5 w-3.5" />
          back
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8 flex justify-center">
              <Link href="/" className="flex items-center gap-2 text-sm">
                <Logo />
                <span>feedbackflow</span>
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
