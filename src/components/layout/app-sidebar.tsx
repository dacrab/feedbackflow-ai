"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, MessageSquare, Settings, Command, Plus, Zap } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";

export function AppSidebar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const items = [
    {
      href: "/dashboard",
      title: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/inbox",
      title: "Inbox",
      icon: Inbox,
      badge: "12" // Mock badge
    },
    {
      href: "/feedback",
      title: "All Feedback",
      icon: MessageSquare,
    },
    {
      href: "/settings",
      title: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className={cn("flex h-screen flex-col border-r border-border/40 bg-sidebar/50 backdrop-blur-xl", className)} {...props}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 font-semibold text-sidebar-foreground mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Command className="h-4 w-4" />
            </div>
            <span className="tracking-tight">FeedbackFlow</span>
        </div>
        
        <Button className="w-full justify-start shadow-sm bg-background border border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-all" size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            <span className="text-xs">New Project</span>
        </Button>
      </div>

      {/* Nav */}
      <div className="flex-1 px-4 py-2 space-y-6">
        <div>
            <p className="text-xs font-medium text-muted-foreground/50 px-2 mb-2 uppercase tracking-widest">Platform</p>
            <nav className="flex flex-col gap-1">
            {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.href} href={item.href}>
                    <Button
                        variant="ghost"
                        className={cn(
                        "w-full justify-start h-9 px-2 relative transition-all duration-200",
                        isActive 
                            ? "bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium" 
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/20"
                        )}
                    >
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                        )}
                        <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                        {item.title}
                        {item.badge && (
                            <span className="ml-auto text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                {item.badge}
                            </span>
                        )}
                    </Button>
                    </Link>
                );
            })}
            </nav>
        </div>

        {/* Projects Mock */}
        <div>
            <p className="text-xs font-medium text-muted-foreground/50 px-2 mb-2 uppercase tracking-widest">Projects</p>
            <nav className="flex flex-col gap-1">
                 {["Acme Corp", "Linear App", "Vercel"].map((project) => (
                     <Button key={project} variant="ghost" className="w-full justify-start h-9 px-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/20">
                         <div className="h-2 w-2 rounded-full bg-foreground/20 mr-3" />
                         {project}
                     </Button>
                 ))}
            </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/40 space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 border border-primary/10">
             <div className="flex items-center gap-2 text-primary mb-1">
                 <Zap className="h-4 w-4 fill-current" />
                 <span className="text-xs font-bold">Pro Plan</span>
             </div>
             <p className="text-[10px] text-muted-foreground mb-3">You've used 80% of your quota.</p>
             <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                 <div className="h-full bg-primary w-[80%]" />
             </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <UserNav />
        </div>
      </div>
    </div>
  );
}
