import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerSession } from "@/lib/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const email = session.user.email ?? "";

  return (
    <div className="flex min-h-screen font-mono">
      <Sidebar userEmail={email} />

      <main className="flex-1 overflow-auto">
        <header className="md:hidden flex h-14 items-center justify-between px-4 border-b border-border bg-background">
          <div className="flex items-center gap-2 text-sm">
            <Logo />
            <span>feedbackflow</span>
          </div>
          <ThemeToggle />
        </header>

        <header className="hidden md:flex h-12 items-center justify-end px-4 border-b border-border">
          <ThemeToggle />
        </header>

        <div className="p-4 md:p-6 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
