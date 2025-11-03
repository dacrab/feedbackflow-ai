"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PasswordField from "@/components/auth/password-field";
import Button from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { extractErrorMessage } from "@/lib/utils/auth";
import { calculatePasswordScore, isPasswordValid } from "@/lib/utils/password";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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

  const score = calculatePasswordScore(password);

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
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Checking link
          </span>
          <h2 className="text-3xl font-semibold leading-tight text-foreground">
            Validating reset session
          </h2>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-left">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Finalize access
        </span>
        <h2 className="text-3xl font-semibold leading-tight text-foreground">Set a new password</h2>
        <p className="text-sm text-muted-foreground">
          Update your credentials to get back into FeedbackFlow with full access.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <PasswordField
          id="password"
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showStrengthIndicator
        />

        <PasswordField
          id="confirm"
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your password"
        />

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Updating…" : "Update password"}
        </Button>
      </form>

      {err && <p className="text-sm text-red-500">{err}</p>}
    </div>
  );
}
