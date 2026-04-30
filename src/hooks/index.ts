/**
 * API hooks for data fetching and mutations
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useApiQuery<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
      const json = await res.json();
      setData(json);
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

interface MutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApiMutation<T = unknown>(options: MutationOptions<T> = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (url: string, fetchOptions: RequestInit = {}): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) throw new Error((await res.text()) || `Request failed: ${res.status}`);
      const data = (await res.json()) as T;
      if (options.successMessage) toast.success(options.successMessage);
      options.onSuccess?.(data);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      if (options.errorMessage) toast.error(options.errorMessage);
      options.onError?.(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}
