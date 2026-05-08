"use client";

import { createAuthClient } from "better-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthDivider, OAuthButtons } from "@/components/oauth-buttons";
import { Button, Input } from "@/components/ui/ui";

const { signIn, signUp } = createAuthClient();

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">email</span>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">password</span>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isSignup ? 8 : undefined}
          />
          {isSignup && <p className="text-xs text-muted-foreground">min 8 chars</p>}
        </label>
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
