import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerSession } from "@/lib/api";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const email = session.user.email ?? "";

  return (
    <div className="flex min-h-screen font-mono">
      <Sidebar userEmail={email} />

      <main id="main-content" className="flex-1 overflow-auto">
        <header className="flex h-12 items-center justify-between md:justify-end px-4 border-b border-border bg-background">
          <div className="flex items-center gap-2 text-sm md:hidden">
            <Logo />
            <span>feedbackflow</span>
          </div>
          <ThemeToggle />
        </header>
        <div className="p-4 md:p-6 w-full">{children}</div>
      </main>
    </div>
  );
}
