import Link from "next/link";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export async function LandingNav() {
  const session = await auth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="bg-primary text-primary-foreground p-1 rounded-lg">
            <Command className="h-5 w-5" />
          </div>
          <span className="tracking-tight">FeedbackFlow</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="#features"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            How it Works
          </Link>
          <Link
            href="#pricing"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {session ? (
            <Link href="/dashboard">
              <Button variant="default" size="sm" className="rounded-full">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="rounded-full px-6">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
