"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import EmailField from "@/components/auth/email-field";
import OAuthProviders from "@/components/auth/oauth-providers";
import PasswordField from "@/components/auth/password-field";
import Button from "@/components/ui/button";
import { useOAuth } from "@/hooks/use-oauth";
import { extractErrorMessage, normalizeEmail } from "@/lib/utils/auth";

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
      const result = await signIn("credentials", {
        email: normalizeEmail(email),
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (result?.error) {
        setErr(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Signed in");
      router.push(result?.url ?? "/dashboard");
      router.refresh();
    } catch (e: unknown) {
      const msg = extractErrorMessage(e);
      setErr(msg);
      toast.error(msg);
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
        <a href="/signup" className="text-left text-sm font-medium text-foreground underline">
          Need an account? Create one
        </a>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
    </div>
  );
}
