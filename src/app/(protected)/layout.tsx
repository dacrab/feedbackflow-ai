import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen w-full bg-background">
        <div className="hidden md:block w-[260px] shrink-0 sticky top-0 h-screen z-30">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/5">
          {/* Mobile Header */}
          <header className="md:hidden flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 sticky top-0 z-20">
            <div className="flex items-center gap-2 font-semibold text-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" /></svg>
                </div>
                FeedbackFlow
            </div>
            {/* Mobile menu trigger would go here */}
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
              {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
