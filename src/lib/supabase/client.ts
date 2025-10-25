"use client";

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

export function createBrowserClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] as string | undefined;
  const anon = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] as string | undefined;
  if (!url || !anon) {
    throw new Error("Supabase env vars are missing");
  }
  return createSupabaseBrowserClient(url, anon);
}
