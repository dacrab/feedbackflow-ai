/**
 * Reusable hook for API mutations with loading and error states
 */

import { useState } from "react";
import { toast } from "sonner";

interface UseApiMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApiMutation<T = unknown>(options: UseApiMutationOptions<T> = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    url: string,
    fetchOptions: RequestInit = {},
    transform?: (data: unknown) => T,
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      const transformed = transform ? transform(data) : (data as T);
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      options.onSuccess?.(transformed);
      return transformed;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      if (options.errorMessage) {
        toast.error(options.errorMessage);
      }
      options.onError?.(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}
