"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import { GitHubIcon, GoogleIcon, LockIcon, MailIcon, UserPlusIcon } from "@/components/ui/icons";
import Input from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import { extractErrorMessage, getAuthRedirectTo, normalizeEmail, validateEmail } from "@/lib/utils/auth";
import { calculatePasswordScore, isPasswordValid } from "@/lib/utils/password";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const [isVerifyStep, setIsVerifyStep] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  const passwordScore = useMemo(() => calculatePasswordScore(password), [password]);

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
        <h2 className="text-3xl font-semibold leading-tight text-foreground">Create your FeedbackFlow workspace</h2>
        <p className="text-sm text-muted-foreground">
          Verify your email to activate automated ingest, LLM analysis, and real-time triage.
        </p>
      </div>

      {isVerifyStep ? (
        <div className="space-y-6 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] p-6">
          <div className="text-sm leading-relaxed text-muted-foreground">
            We sent a verification link to {" "}
            <span className="font-medium text-foreground">{verificationEmail || email}</span>. Check your inbox and confirm to finish creating your account.
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
              aria-invalid={!!err && !validateEmail(email)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2 text-sm">
            <label htmlFor="password" className="inline-flex items-center gap-2 font-medium text-muted-foreground">
              <LockIcon className="h-4 w-4" /> Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                aria-invalid={!!err}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-muted-foreground underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_92%,transparent)] p-3">
                <div className="h-1.5 w-full rounded-full bg-[color-mix(in_oklab,var(--accent)_8%,var(--background))]">
                  <div
                    className={
                      "h-1.5 rounded-full transition-all " +
                      (passwordScore <= 1
                        ? "bg-red-400 w-1/5"
                        : passwordScore === 2
                          ? "bg-orange-400 w-2/5"
                          : passwordScore === 3
                            ? "bg-yellow-400 w-3/5"
                            : passwordScore === 4
                              ? "bg-lime-500 w-4/5"
                              : "bg-emerald-500 w-full")
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use at least 8 chars with uppercase, lowercase, a number, and a symbol.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <label htmlFor="confirm" className="font-medium text-muted-foreground">
              Confirm password
            </label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                aria-invalid={password !== confirmPassword && confirmPassword.length > 0}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-muted-foreground underline"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

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
              I agree to the {" "}
              <a className="underline" href="/terms" target="_blank" rel="noreferrer">
                Terms
              </a>{" "}
              and {" "}
              <a className="underline" href="/privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              .
            </label>
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Creating account…" : "Sign up"}
          </Button>
        </form>
      )}

      {!isVerifyStep && (
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
      )}
      <div className="text-sm text-muted-foreground">
        Already onboard? <a href="/login" className="font-medium text-foreground underline">Sign in</a>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
      {msg && <p className="text-sm text-emerald-500">{msg}</p>}
    </div>
  );
}