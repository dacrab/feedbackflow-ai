import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";
import AppToaster from "@/components/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FeedbackFlow AI",
  description: "Automated micro-SaaS to ingest, analyze, and triage public feedback using LLMs.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCookie = (await cookies()).get("theme")?.value;
  const htmlClass = themeCookie === "dark" ? "dark" : themeCookie === "light" ? "light" : undefined;
  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`!function(){try{var d=document.documentElement;var v=localStorage.getItem('theme');if(v==='dark'||v==='light'){d.classList.remove('light','dark');d.classList.add(v)}else{var m=window.matchMedia('(prefers-color-scheme: dark)');d.classList.add(m.matches?'dark':'light')}}catch(e){}}();`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-foreground focus:text-background"
        >
          Skip to content
        </a>
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
          <div className="absolute -top-40 right-0 h-96 w-96 rounded-full glow-blue-strong blur-2xl" />
          <div className="absolute top-1/3 -left-32 h-[28rem] w-[28rem] rounded-full glow-indigo blur-3xl" />
          <div className="absolute inset-0 glow-teal-overlay" />
        </div>
        <div id="content" tabIndex={-1}>
          {children}
        </div>
        <AppToaster />
      </body>
    </html>
  );
}
