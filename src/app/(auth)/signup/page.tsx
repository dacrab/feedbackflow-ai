"use client";

import { IconLoader2 } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { AuthDivider, OAuthButtons } from "@/components/oauth-buttons";

export default function SignupPage() {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "failed to create account");
      }

      toast.success("account created");

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-mono">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">// new user</p>
        <h1 className="text-xl font-medium">signup</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor={emailId} className="text-sm text-muted-foreground">
            email
          </label>
          <input
            id={emailId}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-10 px-3 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={passwordId} className="text-sm text-muted-foreground">
            password
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full h-10 px-3 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground transition-colors"
          />
          <p className="text-xs text-muted-foreground">
            min 8 chars, uppercase, lowercase, number
          </p>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 rounded bg-foreground text-background text-sm transition-colors hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "create account →"}
        </button>
      </form>

      <AuthDivider />
      <OAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        have an account?{" "}
        <Link href="/login" className="text-foreground hover:underline">
          login
        </Link>
      </p>
    </div>
  );
}
