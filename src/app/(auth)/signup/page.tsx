"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import EmailField from "@/components/auth/email-field";
import OAuthProviders from "@/components/auth/oauth-providers";
import PasswordField from "@/components/auth/password-field";
import Button from "@/components/ui/button";
import { UserPlusIcon } from "@/components/ui/icons";
import { useOAuth } from "@/hooks/use-oauth";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  extractErrorMessage,
  getAuthRedirectTo,
  normalizeEmail,
  validateEmail,
} from "@/lib/utils/auth";
import { calculatePasswordScore, isPasswordValid } from "@/lib/utils/password";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const [isVerifyStep, setIsVerifyStep] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const { signInWithOAuth, isLoading: oauthLoading } = useOAuth();

  const passwordScore = calculatePasswordScore(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (honeypotRef.current?.value) {
      return; // bot submission ignored
    }
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
      const supa = createBrowserClient();
      const redirectTo = getAuthRedirectTo();
      const { error, data } = await supa.auth.signUp({
        email: normalizedEmail,
        password,
        ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
      });
      if (error) {
        const m = String(error.message || "Signup failed");
        if (m.toLowerCase().includes("already") || m.toLowerCase().includes("exists")) {
          toast.message("Account already exists. Please sign in.");
        } else {
          toast.error(m);
        }
        setErr(m);
        return;
      }
      if (data?.user) {
        // Sign out if session was created (email verification required)
        if (data.session) {
          await supa.auth.signOut();
        }
        toast.success("Account created. Check your email to confirm.");
        setMsg("Account created. Please check your email to confirm and then log in.");
        setIsVerifyStep(true);
        setVerificationEmail(normalizedEmail);
        // Fire an immediate resend to ensure the email is sent
        try {
          await supa.auth.resend({
            type: "signup",
            email: normalizedEmail,
            ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
          });
          toast.success("Verification email sent");
        } catch (resendErr) {
          // Don't break UX; surface as a non-blocking toast
          toast.error(`Failed to send email: ${extractErrorMessage(resendErr)}`);
        }
        return;
      }
    } catch (e: unknown) {
      const message = extractErrorMessage(e);
      setErr(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onResendVerification() {
    try {
      setResending(true);
      const supa = createBrowserClient();
      const redirectTo = getAuthRedirectTo();
      const targetEmail = normalizeEmail(verificationEmail || email);
      const { error } = await supa.auth.resend({
        type: "signup",
        email: targetEmail,
        ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
      });
      if (error) throw error;
      toast.success("Verification email resent");
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-left">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          <UserPlusIcon className="h-4 w-4" /> Start in minutes
        </span>
        <h2 className="text-3xl font-semibold leading-tight text-foreground">
          Create your FeedbackFlow workspace
        </h2>
        <p className="text-sm text-muted-foreground">
          Verify your email to activate automated ingest, LLM analysis, and real-time triage.
        </p>
      </div>

      {isVerifyStep ? (
        <div className="space-y-6 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] p-6">
          <div className="text-sm leading-relaxed text-muted-foreground">
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{verificationEmail || email}</span>. Check
            your inbox and confirm to finish creating your account.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onResendVerification} disabled={resending}>
              {resending ? "Resending…" : "Resend email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsVerifyStep(false);
                setMsg(null);
                setErr(null);
              }}
            >
              Use a different email
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/80">
            Didn't receive it? Check spam, then resend. You can also switch emails anytime.
          </p>
        </div>
      ) : (
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
            showStrengthIndicator
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

          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] p-4">
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
      )}

      {!isVerifyStep && (
        <OAuthProviders onProviderClick={signInWithOAuth} disabled={isLoading || oauthLoading} />
      )}
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
