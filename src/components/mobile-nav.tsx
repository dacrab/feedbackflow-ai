"use client";

import { IconLogout } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav-items";
import { cn } from "@/lib/utils";

/** The sidebar is hidden below md, so without this there is no navigation and
 *  no way to sign out on a phone. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-background">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <form action="/logout" method="POST" className="flex flex-1">
        <button
          type="submit"
          className="flex w-full flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconLogout className="h-4 w-4" />
          logout
        </button>
      </form>
    </nav>
  );
}
