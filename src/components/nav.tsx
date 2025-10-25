"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href === "/inbox" && (pathname.startsWith("/inbox") || pathname.startsWith("/feedback")));
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm transition-colors border",
        active
          ? "bg-foreground text-background border-border"
          : "text-foreground/70 hover:bg-background border-transparent",
      )}
    >
      {children}
    </Link>
  );
}

export default function Nav() {
  return (
    <nav className="flex items-center gap-2">
      <NavLink href="/dashboard">Dashboard</NavLink>
      <NavLink href="/inbox">Inbox</NavLink>
      <NavLink href="/settings">Settings</NavLink>
    </nav>
  );
}
