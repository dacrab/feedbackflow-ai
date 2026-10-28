import { SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { PageHeader } from "@/components/ui/ui";

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
    <div className="space-y-6">
      <PageHeader eyebrow={isSignup ? "new user" : "authentication"} title={mode} />

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

      <p className="text-muted-foreground text-center text-sm">
        {isSignup ? "have an account? " : "no account? "}
        <Link href={isSignup ? "/login" : "/signup"} className="text-foreground hover:underline">
          {isSignup ? "login" : "signup"}
        </Link>
      </p>
    </div>
  );
}
