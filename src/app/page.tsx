import {
  ArrowRight,
  BarChart3,
  Check,
  Command,
  GitPullRequest,
  Globe,
  MessageSquare,
  Shield,
  Slack,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      <LandingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Background - Subtle Grid & Gradient */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
          </div>

          <div className="container mx-auto max-w-6xl px-4 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Badge */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary backdrop-blur-sm transition-colors hover:bg-primary/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="font-medium text-xs tracking-wide uppercase">
                    New: AI Analysis 2.0
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl leading-[1.1]">
                Turn messy feedback into <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  shipping decisions
                </span>
              </h1>

              {/* Subheadline */}
              <p className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 max-w-2xl text-xl text-muted-foreground leading-relaxed">
                The command center for modern product teams. Centralize feedback from every channel,
                detect patterns with AI, and prioritize your roadmap with confidence.
              </p>

              {/* CTAs */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="h-12 px-8 rounded-full text-base font-medium shadow-lg shadow-primary/20 transition-transform hover:scale-105"
                  >
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 rounded-full text-base font-medium border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/50"
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> View Demo
                  </Button>
                </Link>
              </div>

              {/* Hero Visual */}
              <div className="w-full max-w-5xl mt-16 relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[2/1]">
                  {/* Mock Interface Header */}
                  <div className="h-10 border-b border-border/50 flex items-center px-4 gap-2 bg-muted/20">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/20" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/20" />
                      <div className="h-3 w-3 rounded-full bg-green-500/20" />
                    </div>
                    <div className="ml-4 h-4 w-32 rounded-full bg-muted/50" />
                  </div>

                  {/* Mock Content */}
                  <div className="p-6 grid grid-cols-12 gap-6 h-full">
                    {/* Sidebar Mock */}
                    <div className="hidden md:block col-span-2 space-y-3 border-r border-border/50 pr-6">
                      <div className="h-8 w-full rounded bg-primary/10" />
                      <div className="h-4 w-3/4 rounded bg-muted/40" />
                      <div className="h-4 w-5/6 rounded bg-muted/40" />
                      <div className="h-4 w-4/5 rounded bg-muted/40" />
                    </div>

                    {/* Main Content Mock */}
                    <div className="col-span-12 md:col-span-10 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-48 rounded bg-muted/40" />
                        <div className="flex gap-2">
                          <div className="h-8 w-20 rounded bg-muted/40" />
                          <div className="h-8 w-8 rounded bg-primary/20" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-24 rounded-lg border border-border/50 bg-muted/10 p-4 space-y-2"
                          >
                            <div className="flex justify-between">
                              <div className="h-4 w-4 rounded bg-primary/20" />
                              <div className="h-4 w-12 rounded bg-muted/40" />
                            </div>
                            <div className="h-6 w-16 rounded bg-muted/40 mt-2" />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-16 w-full rounded-lg border border-border/50 bg-background flex items-center px-4 gap-4"
                          >
                            <div className="h-8 w-8 rounded-full bg-muted/40 shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-1/3 rounded bg-muted/40" />
                              <div className="h-2 w-2/3 rounded bg-muted/20" />
                            </div>
                            <div className="h-6 w-16 rounded-full bg-emerald-500/10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 border-y border-border/40 bg-muted/5">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-8">
              TRUSTED BY PRODUCT TEAMS AT
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-50">
              {/* Logos would go here - using text placeholders for now */}
              {["Acme Corp", "Global Bank", "TechStart", "Innovate", "Future Labs"].map((logo) => (
                <div key={logo} className="text-xl font-bold font-mono">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 px-4">
          <div className="container mx-auto max-w-6xl space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Everything you need to build better products
              </h2>
              <p className="text-lg text-muted-foreground">
                Stop managing feedback in spreadsheets. Use our AI-powered suite to automate the
                boring stuff.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 - Ingest */}
              <Card className="md:col-span-2 border-border/50 bg-gradient-to-br from-muted/50 to-background shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                    <Globe className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Universal Ingestion</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground max-w-md mb-8">
                    Connect every channel. We pull feedback from Slack, Intercom, GitHub, and Email
                    into one unified inbox.
                  </p>
                  <div className="flex gap-4 absolute right-0 bottom-8 opacity-50 group-hover:opacity-100 group-hover:-translate-x-4 transition-all duration-500">
                    <div className="bg-background border p-3 rounded-xl shadow-lg rotate-6">
                      <Slack className="h-8 w-8" />
                    </div>
                    <div className="bg-background border p-3 rounded-xl shadow-lg -rotate-6">
                      <GitPullRequest className="h-8 w-8" />
                    </div>
                    <div className="bg-background border p-3 rounded-xl shadow-lg rotate-12">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 2 - AI */}
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Auto-tagging, sentiment analysis, and summarization powered by advanced LLMs.
                  </p>
                  <div className="space-y-2">
                    <div className="bg-background/80 p-2 rounded-lg border text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> Positive
                    </div>
                    <div className="bg-background/80 p-2 rounded-lg border text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> High Severity
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 3 - Analytics */}
              <Card className="border-border/50 bg-gradient-to-br from-muted/50 to-background shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Visualize trends over time. Spot churn risks before they happen.
                  </p>
                  <div className="mt-6 h-24 flex items-end gap-1 opacity-50">
                    {[40, 70, 50, 90, 60, 80].map((h) => (
                      <div
                        key={h}
                        className="flex-1 bg-purple-500/20 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Feature 4 - Security */}
              <Card className="md:col-span-2 border-border/50 bg-gradient-to-br from-muted/50 to-background shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row">
                <div className="p-6 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                    <Shield className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Enterprise Ready</CardTitle>
                  <p className="text-muted-foreground">
                    SOC2 compliant, SSO, and advanced role-based access control. Built for teams
                    that scale.
                  </p>
                </div>
                <div className="bg-muted/30 w-full md:w-1/3 p-6 flex flex-col justify-center border-l border-border/50 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" /> SAML SSO
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" /> Audit Logs
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" /> 99.9% Uptime
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* How it works / Step */}
        <section className="py-24 bg-muted/5 border-y border-border/40">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-background border rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow-sm">
                  1
                </div>
                <h3 className="text-xl font-semibold">Connect Sources</h3>
                <p className="text-muted-foreground text-sm">
                  Link your Slack channels, support emails, and GitHub repos in one click.
                </p>
              </div>
              <div className="text-center space-y-4 relative">
                <div className="hidden md:block absolute top-6 -left-1/2 w-full h-[1px] bg-border -z-10" />
                <div className="w-12 h-12 bg-background border rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow-sm z-10 relative">
                  2
                </div>
                <h3 className="text-xl font-semibold">AI Processing</h3>
                <p className="text-muted-foreground text-sm">
                  Our engine categorizes, prioritizes, and links related feedback automatically.
                </p>
              </div>
              <div className="text-center space-y-4 relative">
                <div className="hidden md:block absolute top-6 -left-1/2 w-full h-[1px] bg-border -z-10" />
                <div className="w-12 h-12 bg-background border rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow-sm z-10 relative">
                  3
                </div>
                <h3 className="text-xl font-semibold">Take Action</h3>
                <p className="text-muted-foreground text-sm">
                  Push vetted features to Linear or Jira and close the loop with customers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to build what users actually want?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join 500+ product teams using FeedbackFlow to clarify their roadmap.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-full text-lg font-medium shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  Get Started for Free
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg">
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              No credit card required. 14-day free trial on Pro plans.
            </p>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border/40 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2 font-bold text-lg">
                <div className="bg-primary text-primary-foreground p-1 rounded-lg">
                  <Command className="h-4 w-4" />
                </div>
                <span>FeedbackFlow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The feedback intelligence platform for modern software teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 FeedbackFlow AI. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-foreground">
                Twitter
              </Link>
              <Link href="#" className="hover:text-foreground">
                GitHub
              </Link>
              <Link href="#" className="hover:text-foreground">
                LinkedIn
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
