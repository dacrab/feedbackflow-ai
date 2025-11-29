"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { InboxIcon, LayoutIcon, SettingsIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type NavProps = {
  orientation?: "vertical" | "horizontal";
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutIcon },
  { href: "/inbox", label: "Inbox", icon: InboxIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function NavLink({ item, orientation }: { item: NavItem; orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const active =
    pathname === item.href ||
    (item.href === "/inbox" && (pathname.startsWith("/inbox") || pathname.startsWith("/feedback")));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2 rounded-xl border border-transparent transition-colors",
        orientation === "vertical" ? "px-3 py-2" : "px-3 py-1.5 text-sm",
        active ? "nav-link-active" : "nav-link-inactive",
      )}
    >
      <Icon className="h-4 w-4 opacity-80 group-hover:opacity-100" size={18} />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

export default function Nav({ orientation = "vertical" }: NavProps) {
  return (
    <nav
      className={cn(
        "gap-1",
        orientation === "vertical"
          ? "flex flex-col"
          : "flex flex-wrap items-center justify-start gap-2",
      )}
    >
      {items.map((item) => (
        <NavLink key={item.href} item={item} orientation={orientation} />
      ))}
    </nav>
  );
}
