"use client";

import { IconLogout } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_ITEMS } from "@/components/nav-items";
import { cn } from "@/lib/utils";

/** The sidebar is hidden below md, so without this there is no navigation and
 *  no way to sign out on a phone. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-border border-t bg-background md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(pathname, item.href);
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
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <form action="/logout" method="POST" className="flex flex-1">
        <button
          type="submit"
          className="flex w-full flex-col items-center gap-0.5 py-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
        >
          <IconLogout className="size-4" />
          logout
        </button>
      </form>
    </nav>
  );
}
