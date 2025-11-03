/**
 * Shared API utilities
 */

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

/**
 * Get authenticated user from route handler
 * Returns null if not authenticated
 */
export async function getAuthUser() {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  return auth.user || null;
}

/**
 * Require authentication - returns user or throws Response
 * The thrown Response can be caught and returned directly
 */
export async function requireAuth(): Promise<NonNullable<Awaited<ReturnType<typeof getAuthUser>>>> {
  const user = await getAuthUser();
  if (!user) {
    const response = NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw response;
  }
  return user;
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response helper
 */
export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}
