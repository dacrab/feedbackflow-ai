import { Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen">
        <Sidebar userEmail={session.user.email ?? ""} />

        <main className="flex-1 overflow-auto">
          {/* Mobile header */}
          <header className="md:hidden flex h-16 items-center justify-between px-6 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-semibold">FeedbackFlow</span>
            </div>
          </header>

          <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
