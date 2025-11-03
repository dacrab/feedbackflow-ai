"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import EmailField from "@/components/auth/email-field";
import OAuthProviders from "@/components/auth/oauth-providers";
import PasswordField from "@/components/auth/password-field";
import Button from "@/components/ui/button";
import { useOAuth } from "@/hooks/use-oauth";
import { createBrowserClient } from "@/lib/supabase/client";
import { extractErrorMessage, getAuthRedirectTo, normalizeEmail } from "@/lib/utils/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signInWithOAuth, isLoading: oauthLoading } = useOAuth();

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

  async function onResetPassword() {
    try {
      if (!email) {
        toast.message("Enter your email to reset password.");
        return;
      }
      setIsLoading(true);
      const supa = createBrowserClient();
      const redirectTo = getAuthRedirectTo("/reset-password");
      const { error } = await supa.auth.resetPasswordForEmail(
        normalizeEmail(email),
        redirectTo ? { redirectTo } : undefined,
      );
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
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Welcome back
        </span>
        <h2 className="text-3xl font-semibold leading-tight text-foreground">
          Sign in to your workspace
        </h2>
        <p className="text-sm text-muted-foreground">
          Use your email credentials or continue with a connected provider.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <EmailField value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          showIcon
        />
        <Button className="w-full" type="submit" disabled={isLoading || oauthLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <OAuthProviders onProviderClick={signInWithOAuth} disabled={isLoading || oauthLoading} />
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={onResetPassword}
          className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground underline"
        >
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
