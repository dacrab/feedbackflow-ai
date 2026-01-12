import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";

export const verifySession = cache(async () => {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  return { userId, email: session?.user?.email ?? "" };
});

export const getOptionalSession = cache(async () => {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) return null;

  return { userId, email: session?.user?.email ?? "" };
});
