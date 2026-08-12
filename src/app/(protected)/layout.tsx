import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Brand } from "@/components/logo";
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
      <Suspense
        fallback={<div className="hidden md:flex w-52 border-r border-border bg-background" />}
      >
        <Sidebar userEmail={email} initialCollapsed={initialCollapsed} />
      </Suspense>

      <main id="main-content" className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between md:justify-end px-4 border-b border-border bg-background">
          <Brand className="md:hidden" />
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
