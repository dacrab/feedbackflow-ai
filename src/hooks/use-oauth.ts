/**
 * Reusable hook for OAuth authentication
 */

import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils/auth";

type OAuthProvider = "github" | "google";

export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithOAuth = async (provider: OAuthProvider) => {
    try {
      setIsLoading(true);
      const result = await signIn(provider, { callbackUrl: "/dashboard", redirect: false });
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithOAuth, isLoading };
}
