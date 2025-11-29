import { Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <span>FeedbackFlow</span>
        </Link>
        <div>
          <blockquote className="text-xl font-medium leading-relaxed">
            "FeedbackFlow transformed how we handle customer feedback. What used to take hours now
            happens automatically."
          </blockquote>
          <div className="mt-4 text-background/70">
            <div className="font-medium text-background">Sarah Chen</div>
            <div className="text-sm">Head of Product, TechCorp</div>
          </div>
        </div>
        <div className="text-sm text-background/50">Trusted by teams at companies worldwide</div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Zap className="h-4 w-4" />
              </div>
              <span>FeedbackFlow</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
