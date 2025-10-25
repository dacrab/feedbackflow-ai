import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieOptions = {
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  maxAge?: number;
};

export async function createRSCClient() {
  const cookieStore = await cookies();
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anon = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !anon) {
    throw new Error("Supabase env vars are missing");
  }
  return createSupabaseServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // no-op in RSC to avoid readonly mutation errors
      },
    },
  });
}

export async function createRouteHandlerClient() {
  const cookieStore = await cookies();
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anon = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !anon) {
    throw new Error("Supabase env vars are missing");
  }
  return createSupabaseServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options as CookieOptions);
        });
      },
    },
  });
}

// Backwards compatible alias for components already importing createServerClient
export const createServerClient = createRSCClient;
