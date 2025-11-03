/**
 * Reusable hook for API queries with loading and error states
 */

import { useCallback, useEffect, useState } from "react";

export function useApiQuery<T>(url: string, options: RequestInit = {}) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { ...options, cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      return json;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
