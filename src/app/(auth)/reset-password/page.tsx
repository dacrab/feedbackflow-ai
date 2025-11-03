"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import { extractErrorMessage } from "@/lib/utils/auth";
import { calculatePasswordScore, isPasswordValid } from "@/lib/utils/password";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supa = createBrowserClient();
      const { data } = await supa.auth.getSession();
      if (!data.session) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        router.push("/login");
      } else {
        setHasRecoverySession(true);
      }
    };
    checkSession();
  }, [router]);

  const score = useMemo(() => calculatePasswordScore(password), [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    if (!isPasswordValid(score)) {
      setErr("Password does not meet security requirements.");
      return;
    }
    try {
      setIsLoading(true);
      const supa = createBrowserClient();
      const { error } = await supa.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully");
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

  if (!hasRecoverySession) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Checking link</span>
          <h2 className="text-3xl font-semibold leading-tight text-foreground">Validating reset session</h2>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-left">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Finalize access</span>
        <h2 className="text-3xl font-semibold leading-tight text-foreground">Set a new password</h2>
        <p className="text-sm text-muted-foreground">
          Update your credentials to get back into FeedbackFlow with full access.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-2 text-sm">
          <label htmlFor="password" className="font-medium text-muted-foreground">
            New password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-muted-foreground underline"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <div className="space-y-2 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_92%,transparent)] p-3">
            <div className="h-1.5 w-full rounded-full bg-[color-mix(in_oklab,var(--accent)_8%,var(--background))]">
              <div
                className={
                  "h-1.5 rounded-full transition-all " +
                  (score <= 1
                    ? "bg-red-400 w-1/5"
                    : score === 2
                      ? "bg-orange-400 w-2/5"
                      : score === 3
                        ? "bg-yellow-400 w-3/5"
                        : score === 4
                          ? "bg-lime-500 w-4/5"
                          : "bg-emerald-500 w-full")
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use at least 8 characters with upper, lower, number, and symbol for best security.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <label htmlFor="confirm" className="font-medium text-muted-foreground">
            Confirm password
          </label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
        </div>

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Updating…" : "Update password"}
        </Button>
      </form>

      {err && <p className="text-sm text-red-500">{err}</p>}
    </div>
  );
}
