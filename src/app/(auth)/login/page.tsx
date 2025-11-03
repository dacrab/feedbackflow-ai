"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import { GitHubIcon, GoogleIcon, LockIcon, MailIcon } from "@/components/ui/icons";
import Input from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import { extractErrorMessage, getAuthRedirectTo, normalizeEmail } from "@/lib/utils/auth";

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
      const { data, error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user && !data.user.email_confirmed_at) {
        toast.error("Please verify your email before signing in. Check your inbox.");
        await supa.auth.signOut();
        return;
      }
      toast.success("Signed in");
      router.push("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      const msg = extractErrorMessage(e);
      setErr(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function continueWith(provider: "github" | "google") {
    try {
      setIsLoading(true);
      const supa = createBrowserClient();
      const redirectTo = getAuthRedirectTo();
      await supa.auth.signInWithOAuth({
        provider,
        ...(redirectTo ? { options: { redirectTo } } : {}),
      });
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e));
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
      const redirectTo = getAuthRedirectTo("/reset-password");
      const { error } = await supa.auth.resetPasswordForEmail(normalizeEmail(email), redirectTo ? { redirectTo } : undefined);
      if (error) throw error;
      toast.success("Password reset email sent");
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-left">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Welcome back</span>
        <h2 className="text-3xl font-semibold leading-tight text-foreground">Sign in to your workspace</h2>
        <p className="text-sm text-muted-foreground">
          Use your email credentials or continue with a connected provider.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-2 text-sm">
          <label htmlFor="email" className="inline-flex items-center gap-2 font-medium text-muted-foreground">
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
        <div className="space-y-2 text-sm">
          <label htmlFor="password" className="inline-flex items-center gap-2 font-medium text-muted-foreground">
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
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>or continue with</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            className="w-full"
            disabled={isLoading}
            onClick={() => continueWith("github")}
            variant="outline"
          >
            <GitHubIcon className="h-4 w-4" /> GitHub
          </Button>
          <Button
            type="button"
            className="w-full"
            disabled={isLoading}
            onClick={() => continueWith("google")}
            variant="outline"
          >
            <GoogleIcon className="h-4 w-4" /> Google
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <button type="button" onClick={onResetPassword} className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground underline">
          Forgot password?
        </button>
        <a href="/signup" className="text-left text-sm font-medium text-foreground underline">
          Need an account? Create one
        </a>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
    </div>
  );
}
