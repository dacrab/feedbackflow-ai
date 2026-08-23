import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "FeedbackFlow",
  description: "AI-powered feedback analysis and insights",
  icons: { icon: "/icon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Set per request by the CSP middleware in src/proxy.ts. Inline scripts
  // (next-themes) and Clerk's clerk-js loader must carry it to survive the
  // strict script-src policy.
  const nonce = (await headers()).get("x-nonce");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ClerkProvider dynamic {...(nonce ? { nonce } : {})}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            {...(nonce ? { nonce } : {})}
          >
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </ThemeProvider>
        </ClerkProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
