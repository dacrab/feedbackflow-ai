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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="text-sm tracking-wider uppercase text-muted">
            FeedbackFlow
          </Link>
          <div className="flex items-center gap-3">
            <Nav />
            <ThemeToggle />
          </div>
          <form action="/logout" method="post">
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6 flex-1 w-full">{children}</main>
      <footer className="border-t mt-12">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-muted">
          © {new Date().getFullYear()} FeedbackFlow AI
        </div>
      </footer>
    </div>
  );
}
