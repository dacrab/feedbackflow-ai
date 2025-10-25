"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  GitHubIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
  UserPlusIcon,
} from "@/components/ui/icons";
import Input from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";

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

  function validateEmail(value: string) {
    const v = value.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  const passwordChecks = useMemo(() => {
    const lengthOk = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const score = [lengthOk, hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    return { lengthOk, hasUpper, hasLower, hasNumber, hasSymbol, score };
  }, [password]);

  useEffect(() => {
    // no-op: reserved for future prefill or analytics
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (honeypotRef.current?.value) {
      return; // bot submission ignored
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      setErr("Enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    if (passwordChecks.score < 4) {
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
      const redirectTo =
        typeof window !== "undefined"
          ? new URL("/auth/callback", window.location.origin).toString()
          : undefined;
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
        if (data.session) {
          // Ensure we do not auto-login; require verification first
          await supa.auth.signOut();
        }
        toast.message("Account created. Check your email to confirm.");
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
        } catch (resendErr) {
          const rm = resendErr instanceof Error ? resendErr.message : String(resendErr);
          // Don't break UX; surface as a non-blocking toast
          toast.error(rm);
        }
        return;
      }
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

  async function onResendVerification() {
    try {
      setResending(true);
      const supa = createBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? new URL("/auth/callback", window.location.origin).toString()
          : undefined;
      const targetEmail = (verificationEmail || email).trim().toLowerCase();
      const { error } = await supa.auth.resend({
        type: "signup",
        email: targetEmail,
        ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
      });
      if (error) throw error;
      toast.success("Verification email resent");
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e);
      toast.error(m);
    } finally {
      setResending(false);
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
          <CardTitle className="text-2xl font-semibold">
            <span className="inline-flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5" /> Create account
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isVerifyStep ? (
            <div className="space-y-4">
              <div className="text-sm">
                We sent a verification link to{" "}
                <span className="font-medium">{verificationEmail || email}</span>. Please check your
                inbox and click the link to finish creating your account.
              </div>
              <div className="flex gap-2">
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
                  Change email
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Wrong address or didn’t get it? Use Change email to edit and try again.
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <input
                ref={honeypotRef}
                type="text"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

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
                  aria-invalid={!!err && !validateEmail(email)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-sm inline-flex items-center gap-2">
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs underline"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-muted rounded">
                      <div
                        className={
                          "h-1.5 rounded transition-all " +
                          (passwordChecks.score <= 1
                            ? "bg-red-500 w-1/5"
                            : passwordChecks.score === 2
                              ? "bg-orange-500 w-2/5"
                              : passwordChecks.score === 3
                                ? "bg-yellow-500 w-3/5"
                                : passwordChecks.score === 4
                                  ? "bg-lime-500 w-4/5"
                                  : "bg-green-600 w-full")
                        }
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use at least 8 characters with a mix of upper, lower, number, and symbol.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="confirm" className="text-sm">
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs underline"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match.</p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5"
                  aria-invalid={!acceptTerms && !!err}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
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

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account…" : "Sign up"}
              </Button>
            </form>
          )}

          {!isVerifyStep && (
            <>
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
            </>
          )}
          <div className="mt-3">
            <a href="/login" className="text-sm underline">
              Already have an account? Sign in
            </a>
          </div>
          {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
          {msg && <p className="text-green-600 text-sm mt-2">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
