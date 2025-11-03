import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Nav from "@/components/nav";
import ThemeToggle from "@/components/theme-toggle";
import Button from "@/components/ui/button";
import { createRSCClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supa = await createRSCClient();
  const { data } = await supa.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="min-h-screen bg-background/80 text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col md:flex-row md:gap-10 md:px-6 md:py-8 lg:px-10">
        <aside className="relative hidden w-full max-w-[248px] flex-col gap-6 rounded-3xl border border-border/70 bg-[color-mix(in_oklab,var(--sidebar)_76%,transparent)] p-6 shadow-xl backdrop-blur-xl md:flex">
          <Link href="/dashboard" className="block">
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">FeedbackFlow</div>
            <div className="mt-2 text-xl font-semibold">Operations Hub</div>
            <p className="mt-3 text-sm text-muted-foreground">
              Monitor sentiment, severity, and topics in a single command center.
            </p>
          </Link>
          <div className="mt-6 flex-1">
            <Nav orientation="vertical" />
          </div>
          <div className="mt-auto space-y-3 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_88%,transparent)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <form action="/logout" method="post" className="flex">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Sign out
              </Button>
            </form>
          </div>
        </aside>

        <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden rounded-none border-none bg-transparent md:rounded-3xl md:border md:border-border/60 md:bg-[color-mix(in_oklab,var(--background)_94%,transparent)] md:shadow-[0_40px_80px_rgba(15,23,42,0.12)] md:backdrop-blur-xl">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-[color-mix(in_oklab,var(--background)_85%,transparent)]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Workspace</p>
                <h1 className="mt-1 text-lg font-semibold">Feedback intelligence</h1>
              </div>
              <div className="ml-auto flex items-center gap-2 md:hidden">
                <ThemeToggle />
                <form action="/logout" method="post">
                  <Button type="submit" variant="outline" size="sm">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
            <div className="mt-4 md:hidden">
              <Nav orientation="horizontal" />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">{children}</main>
          <footer className="border-t border-border/50 px-4 py-4 text-xs text-muted-foreground sm:px-6">
            © {new Date().getFullYear()} FeedbackFlow AI · Built for proactive customer insight
          </footer>
        </div>
      </div>
    </div>
  );
}
