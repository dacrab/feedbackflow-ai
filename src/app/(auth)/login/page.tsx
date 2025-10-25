"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, GitHubIcon, GoogleIcon, LockIcon, MailIcon } from "@/components/ui/icons";
import Input from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      setIsLoading(true);
      const supa = createBrowserClient();
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      router.push("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function continueWith(provider: "github" | "google") {
    try {
      setIsLoading(true);
      const supa = createBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? new URL("/auth/callback", window.location.origin).toString()
          : undefined;
      await supa.auth.signInWithOAuth({
        provider,
        ...(redirectTo ? { options: { redirectTo } } : {}),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPassword() {
    try {
      if (!email) {
        toast.message("Enter your email to reset password.");
        return;
      }
      setIsLoading(true);
      const supa = createBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? new URL("/auth/callback?next=/reset-password", window.location.origin).toString()
          : undefined;
      const options = redirectTo ? { redirectTo } : undefined;
      const { error } = await supa.auth.resetPasswordForEmail(email.trim().toLowerCase(), options);
      if (error) throw error;
      toast.success("Password reset email sent");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-left">
            <Link href="/" className="text-sm inline-flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Link>
          </div>
          <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm inline-flex items-center gap-2">
                <MailIcon className="h-4 w-4" /> Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm inline-flex items-center gap-2">
                <LockIcon className="h-4 w-4" /> Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              className="w-full"
              disabled={isLoading}
              onClick={() => continueWith("github")}
              variant="outline"
            >
              <GitHubIcon className="h-4 w-4" /> Continue with GitHub
            </Button>
            <Button
              type="button"
              className="w-full"
              disabled={isLoading}
              onClick={() => continueWith("google")}
              variant="outline"
            >
              <GoogleIcon className="h-4 w-4" /> Continue with Google
            </Button>
          </div>
          <div className="mt-3">
            <a href="/signup" className="text-sm underline">
              Create an account
            </a>
          </div>
          <div className="mt-2">
            <button type="button" onClick={onResetPassword} className="text-xs underline">
              Forgot password?
            </button>
          </div>
          {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
