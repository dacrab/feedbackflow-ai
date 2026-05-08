import { useState } from "react";
import { toast } from "sonner";

interface MutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApiMutation<T = unknown>(options: MutationOptions<T> = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async (url: string, fetchOptions: RequestInit = {}): Promise<T | null> => {
    setIsLoading(true);
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = (await res.json()) as T;
      if (options.successMessage) toast.success(options.successMessage);
      options.onSuccess?.(data);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (options.errorMessage) toast.error(options.errorMessage);
      options.onError?.(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}
