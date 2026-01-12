"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { AuthDivider, OAuthButtons } from "@/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        const { error } = await signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: email.split("@")[0] || "User",
        });
        if (error) throw new Error(error.message || "failed to create account");
        toast.success("account created");
      }

      const { error } = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error(error.message || "invalid credentials");
        return;
      }

      if (!isSignup) toast.success("authenticated");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "something went wrong");
    } finally {
      setIsLoading(false);
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
        <div className="space-y-2">
          <label htmlFor={emailId} className="text-sm text-muted-foreground">
            email
          </label>
          <Input
            id={emailId}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={passwordId} className="text-sm text-muted-foreground">
            password
          </label>
          <Input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isSignup ? 8 : undefined}
          />
          {isSignup && <p className="text-xs text-muted-foreground">min 8 chars</p>}
        </div>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
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
