import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getServerSession } from "@/lib/session";

export const verifySession = cache(async () => {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return { userId: session.user.id, email: session.user.email ?? "" };
});
