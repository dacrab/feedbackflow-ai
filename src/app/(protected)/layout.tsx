import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import Nav from "@/components/nav";
import ThemeToggle from "@/components/theme-toggle";
import Button from "@/components/ui/button";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),transparent_68%)]" />

      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-2xl border border-border/40 bg-[color-mix(in_oklab,var(--background)_90%,transparent)] px-4 py-2 shadow-sm transition hover:border-border"
          >
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">
              FeedbackFlow
            </span>
            <span className="hidden text-sm text-muted-foreground md:inline">Command Center</span>
          </Link>

          <div className="hidden md:block">
            <Nav orientation="horizontal" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <form action="/logout" method="post">
              <Button type="submit" variant="outline" size="sm" className="rounded-xl">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-border/40 bg-background/60 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl">
            <Nav orientation="horizontal" />
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-4 -z-10 h-44 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.18),transparent_76%)]" />
        <div className="relative flex-1">{children}</div>
      </main>

      <footer className="border-t border-border/40 bg-background/80 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-muted-foreground sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} FeedbackFlow AI · Customer signals at the speed of product.
          </p>
          <p className="text-muted-foreground/80">
            Powered by Next.js 16, Auth.js, Neon Postgres, and automated LLM pipelines.
          </p>
        </div>
      </footer>
    </div>
  );
}
