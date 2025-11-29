import { Command } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left: Auth Form */}
        <div className="flex flex-col justify-center items-center p-8 bg-background relative">
            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
                <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-lg shadow-primary/20">
                    <Command className="h-5 w-5" />
                </div>
                <span className="tracking-tight">FeedbackFlow</span>
            </Link>
            <div className="w-full max-w-[380px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                {children}
            </div>
        </div>
        
        {/* Right: Visuals */}
        <div className="hidden lg:flex flex-col justify-between bg-muted/20 border-l border-border/40 p-12 relative overflow-hidden">
            {/* Rich background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/50" />
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-125 brightness-100" />
            
            {/* Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[128px] animate-float opacity-60" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[128px] animate-pulse-soft opacity-50" />

            {/* Content */}
            <div className="relative z-10 mt-auto max-w-lg">
                <blockquote className="space-y-8">
                    <p className="text-3xl font-medium leading-relaxed tracking-tight text-foreground/90">
                        "FeedbackFlow has completely transformed how we prioritize our roadmap. It's like having a dedicated product analyst working 24/7."
                    </p>
                    <footer className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-indigo-400 border-2 border-background shadow-lg" />
                        <div>
                            <div className="font-semibold text-lg">Alex Chen</div>
                            <div className="text-sm text-muted-foreground font-medium">Head of Product, Acme Corp</div>
                        </div>
                    </footer>
                </blockquote>
            </div>
        </div>
    </div>
  )
}
