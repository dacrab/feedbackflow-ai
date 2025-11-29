"use client";

import { signIn } from "next-auth/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import EmailField from "@/components/auth/email-field";
import OAuthProviders from "@/components/auth/oauth-providers";
import PasswordField from "@/components/auth/password-field";
import Button from "@/components/ui/button";
import { UserPlusIcon } from "@/components/ui/icons";
import { useOAuth } from "@/hooks/use-oauth";
import {
  calculatePasswordScore,
  extractErrorMessage,
  isPasswordValid,
  normalizeEmail,
  validateEmail,
} from "@/lib/utils/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const { signInWithOAuth, isLoading: oauthLoading } = useOAuth();

  const passwordScore = calculatePasswordScore(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (honeypotRef.current?.value) return;

    const normalizedEmail = normalizeEmail(email);
    if (!validateEmail(normalizedEmail)) {
      setErr("Enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    if (!isPasswordValid(passwordScore)) {
      setErr("Password does not meet security requirements.");
      return;
    }
    if (!acceptTerms) {
      setErr("You must accept the Terms and Privacy Policy.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        const message = body.error || "Signup failed";
        if (res.status === 409) {
          toast.message("Account already exists. Please sign in.");
        } else {
          toast.error(message);
        }
        setErr(message);
        return;
      }

      toast.success("Account created. Signing you in…");
      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (signInResult?.error) {
        setMsg("Account created. Please sign in with your credentials.");
        toast.error(signInResult.error);
        return;
      }

      setMsg("Account created. Redirecting to your dashboard…");
      window.location.assign(signInResult?.url ?? "/dashboard");
    } catch (e: unknown) {
      const message = extractErrorMessage(e);
      setErr(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-left">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest-plus text-muted-foreground">
          <UserPlusIcon className="h-4 w-4" /> Start in minutes
        </span>
        <h2 className="text-3xl font-semibold leading-tight text-foreground">
          Create your FeedbackFlow workspace
        </h2>
        <p className="text-sm text-muted-foreground">
          Verify your email to activate automated ingest, LLM analysis, and real-time triage.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <input
          ref={honeypotRef}
          type="text"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <EmailField
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          ariaInvalid={!!err && !validateEmail(email)}
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showStrength
          showIcon
          ariaInvalid={!!err}
        />

        <PasswordField
          id="confirm"
          label="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          ariaInvalid={password !== confirmPassword && confirmPassword.length > 0}
        />
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <p className="text-xs text-red-500">Passwords do not match.</p>
        )}

        <div className="info-box flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border/70"
            aria-invalid={!acceptTerms && !!err}
          />
          <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
            I agree to the{" "}
            <a className="underline" href="/terms" target="_blank" rel="noreferrer">
              Terms
            </a>{" "}
            and{" "}
            <a className="underline" href="/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            .
          </label>
        </div>

        <Button className="w-full" type="submit" disabled={isLoading || oauthLoading}>
          {isLoading ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <OAuthProviders onProviderClick={signInWithOAuth} disabled={isLoading || oauthLoading} />
      <div className="text-sm text-muted-foreground">
        Already onboard?{" "}
        <a href="/login" className="font-medium text-foreground underline">
          Sign in
        </a>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
      {msg && <p className="text-sm text-emerald-500">{msg}</p>}
    </div>
  );
}
