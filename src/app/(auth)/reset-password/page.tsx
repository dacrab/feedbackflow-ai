"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const score = useMemo(() => {
    const lengthOk = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return [lengthOk, hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  }, [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    if (score < 4) {
      setErr("Password does not meet security requirements.");
      return;
    }
    try {
      setIsLoading(true);
      const supa = createBrowserClient();
      const { error } = await supa.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      router.push("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
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
              <span aria-hidden>←</span> Back
            </Link>
          </div>
          <CardTitle className="text-2xl font-semibold">Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs underline"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              <div className="mt-2">
                <div className="h-1.5 w-full bg-muted rounded">
                  <div
                    className={
                      "h-1.5 rounded transition-all " +
                      (score <= 1
                        ? "bg-red-500 w-1/5"
                        : score === 2
                          ? "bg-orange-500 w-2/5"
                          : score === 3
                            ? "bg-yellow-500 w-3/5"
                            : score === 4
                              ? "bg-lime-500 w-4/5"
                              : "bg-green-600 w-full")
                    }
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use at least 8 characters with a mix of upper, lower, number, and symbol.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirm" className="text-sm">
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
          {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
