import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";

export default async function AuthPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (mode !== "login" && mode !== "signup") notFound();
  return <AuthForm mode={mode} />;
}
