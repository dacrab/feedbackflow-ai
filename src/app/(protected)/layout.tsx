import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerSession } from "@/lib/api";
import { LOGIN_PATH, SIDEBAR_COLLAPSED_COOKIE } from "@/lib/constants";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect(LOGIN_PATH);
  const email = session.user.email ?? "";
  const initialCollapsed = (await cookies()).get(SIDEBAR_COLLAPSED_COOKIE)?.value === "true";

  return (
    <div className="flex h-screen overflow-hidden">
      <a
        href="#main-content"
        className="focus:border-border focus:bg-background sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:border focus:px-3 focus:py-2 focus:text-sm"
      >
        skip to content
      </a>

      <Sidebar userEmail={email} initialCollapsed={initialCollapsed} />

      <main id="main-content" className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-border bg-background flex h-12 shrink-0 items-center justify-between border-b px-4 md:justify-end">
          <Brand href="/" className="md:hidden" />
          <ThemeToggle />
        </header>
        {/* Bottom padding clears the mobile tab bar. */}
        <div className="flex-1 overflow-auto p-4 pb-16 md:p-6">{children}</div>
        <MobileNav />
      </main>
    </div>
  );
}
