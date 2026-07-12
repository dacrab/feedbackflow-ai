"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";

const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    card: "w-full shadow-none border border-border bg-transparent",
    formButtonPrimary: "bg-foreground text-background hover:bg-foreground/90",
    footerActionLink: "text-foreground hover:underline",
    formFieldInput: "border-border",
  },
};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";

  return (
    <div className="space-y-6 font-mono">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {isSignup ? "// new user" : "// authentication"}
        </p>
        <h1 className="text-xl font-medium">{mode}</h1>
      </div>

      {isSignup ? (
        <SignUp
          routing="hash"
          signInUrl="/login#"
          fallbackRedirectUrl="/dashboard"
          appearance={clerkAppearance}
        />
      ) : (
        <SignIn
          routing="hash"
          signUpUrl="/signup#"
          fallbackRedirectUrl="/dashboard"
          appearance={clerkAppearance}
        />
      )}

      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? "have an account? " : "no account? "}
        <Link href={isSignup ? "/login" : "/signup"} className="text-foreground hover:underline">
          {isSignup ? "login" : "signup"}
        </Link>
      </p>
    </div>
  );
}
