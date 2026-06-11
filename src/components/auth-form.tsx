"use client";

import { IconBrandGithub } from "@tabler/icons-react";
import { createAuthClient } from "better-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui/ui";

const authClient = createAuthClient();
const { signIn, signUp } = authClient;

const oauthProviders: { id: "github" | "google"; label: string; icon: ReactNode }[] = [
  { id: "github", label: "github", icon: <IconBrandGithub className="h-4 w-4" /> },
  {
    id: "google",
    label: "google",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <title>Google</title>
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isSignup = mode === "signup";

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
          name: normalizedEmail.split("@")[0] || "User",
        });
        if (error) {
          toast.error(error.message || "failed to create account");
          return;
        }
        toast.success("account created");
        router.push("/dashboard");
        router.refresh();
        return;
      }
      const { error } = await signIn.email({ email: normalizedEmail, password });
      if (error) {
        toast.error(error.message || "invalid credentials");
        return;
      }
      toast.success("authenticated");
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
            {mismatch && (
              <p className="text-xs text-red-500 animate-fade-in">passwords do not match</p>
            )}
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
      <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 border-t border-border" />
        <span>or</span>
        <div className="flex-1 border-t border-border" />
      </div>
      <div className="grid grid-cols-2 gap-3 font-mono">
        {oauthProviders.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => signIn.social({ provider: p.id, callbackURL: "/dashboard" })}
            className="h-10 rounded border border-border text-sm transition-colors hover:bg-muted flex items-center justify-center gap-2"
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? "have an account? " : "no account? "}
        <Link href={isSignup ? "/login" : "/signup"} className="text-foreground hover:underline">
          {isSignup ? "login" : "signup"}
        </Link>
      </p>
    </div>
  );
}
