import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-mono">
      {/* Left side - terminal style */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background p-8 flex-col">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <Logo className="h-7 w-7 invert" />
          <span>feedbackflow</span>
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full">
            <p className="text-background/50 text-sm mb-4">$ feedbackflow --info</p>
            <div className="space-y-6 text-sm">
              <div>
                <span className="text-green-400">→</span> ingest feedback from github, slack, or
                manual input
              </div>
              <div>
                <span className="text-green-400">→</span> llm extracts sentiment, topics, severity
              </div>
              <div>
                <span className="text-green-400">→</span> filter, sort, and act on what matters
              </div>
              <div>
                <span className="text-green-400">→</span> get slack alerts for critical issues
              </div>
            </div>
            <div className="mt-8 text-background/50 text-sm">
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-background/40">next.js + neon + llm</div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex flex-col p-8 bg-background">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <IconArrowLeft className="h-3.5 w-3.5" />
          back
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
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
