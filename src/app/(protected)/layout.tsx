import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { SessionProvider } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen font-mono">
        <Sidebar userEmail={session.user.email ?? ""} />

        <main className="flex-1 overflow-auto">
          {/* Mobile header */}
          <header className="md:hidden flex h-14 items-center justify-between px-4 border-b border-border bg-background">
            <div className="flex items-center gap-2 text-sm">
              <Logo />
              <span>feedbackflow</span>
            </div>
            <ThemeToggle />
          </header>

          {/* Desktop header */}
          <header className="hidden md:flex h-12 items-center justify-end px-4 border-b border-border">
            <ThemeToggle />
          </header>

          <div className="p-4 md:p-6 max-w-6xl">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
