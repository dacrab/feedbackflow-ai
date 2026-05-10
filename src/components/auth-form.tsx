"use client";

import { createAuthClient } from "better-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthDivider, OAuthButtons } from "@/components/oauth-buttons";
import { Button, Input } from "@/components/ui/ui";

const { signIn, signUp } = createAuthClient();

function passwordStrength(p: string): { label: string; color: string } {
  if (p.length < 8) return { label: "too short", color: "text-red-500" };
  const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
  if (score === 0) return { label: "weak", color: "text-orange-500" };
  if (score === 1) return { label: "fair", color: "text-yellow-500" };
  if (score === 2) return { label: "good", color: "text-blue-500" };
  return { label: "strong", color: "text-green-500" };
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isSignup = mode === "signup";

  const strength = isSignup && password ? passwordStrength(password) : null;
  const mismatch = isSignup && confirm && password !== confirm;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSignup && password !== confirm) {
      toast.error("passwords do not match");
      return;
    }
    if (isSignup && password.length < 8) {
      toast.error("password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (isSignup) {
        const { error } = await signUp.email({
          email: normalizedEmail,
          password,
          name: email.split("@")[0] || "User",
        });
        if (error) {
          toast.error(error.message || "failed to create account");
          return;
        }
        toast.success("account created");
      }
      const { error } = await signIn.email({ email: normalizedEmail, password });
      if (error) {
        toast.error(error.message || "invalid credentials");
        return;
      }
      if (!isSignup) toast.success("authenticated");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-mono">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {isSignup ? "// new user" : "// authentication"}
        </p>
        <h1 className="text-xl font-medium">{mode}</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5" htmlFor="email">
          <span className="text-sm text-muted-foreground">email</span>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block space-y-1.5" htmlFor="password">
          <span className="text-sm text-muted-foreground">password</span>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={isSignup ? 8 : undefined}
          />
          {strength && <p className={`text-xs ${strength.color}`}>strength: {strength.label}</p>}
        </label>
        {isSignup && (
          <label className="block space-y-1.5" htmlFor="confirm">
            <span className="text-sm text-muted-foreground">confirm password</span>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              aria-invalid={mismatch || undefined}
              className={mismatch ? "border-red-500" : ""}
            />
            {mismatch && <p className="text-xs text-red-500">passwords do not match</p>}
          </label>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="w-full flex items-center justify-center"
        >
          {isSignup ? "create account →" : "sign in →"}
        </Button>
      </form>
      <AuthDivider />
      <OAuthButtons />
      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? "have an account? " : "no account? "}
        <Link href={isSignup ? "/login" : "/signup"} className="text-foreground hover:underline">
          {isSignup ? "login" : "signup"}
        </Link>
      </p>
    </div>
  );
}
