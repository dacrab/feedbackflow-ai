import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerSession } from "@/lib/api";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const email = session.user.email ?? "";
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return (
    <div className="flex h-screen font-mono overflow-hidden">
      <Sidebar userEmail={email} initialCollapsed={initialCollapsed} />

      <main id="main-content" className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between md:justify-end px-4 border-b border-border bg-background">
          <div className="flex items-center gap-2 text-sm md:hidden">
            <Logo />
            <span>feedbackflow</span>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
