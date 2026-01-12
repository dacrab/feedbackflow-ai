import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/auth";

/**
 * Get session on the server - cached per request to avoid multiple DB calls
 */
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
