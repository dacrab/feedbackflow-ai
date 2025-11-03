/**
 * Reusable hook for OAuth authentication
 */

import { useState } from "react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { extractErrorMessage, getAuthRedirectTo } from "@/lib/utils/auth";

type OAuthProvider = "github" | "google";

export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithOAuth = async (provider: OAuthProvider) => {
    try {
      setIsLoading(true);
      const supa = createBrowserClient();
      const redirectTo = getAuthRedirectTo();
      await supa.auth.signInWithOAuth({
        provider,
        ...(redirectTo ? { options: { redirectTo } } : {}),
      });
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithOAuth, isLoading };
}
