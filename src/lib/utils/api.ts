/**
 * Shared API utilities
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";

type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  const user = session?.user as
    | { id?: string; name?: string | null; email?: string | null; image?: string | null }
    | undefined;
  if (!user?.id) {
    return null;
  }
  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  };
}

/**
 * Require authentication - returns user or throws Response
 * The thrown Response can be caught and returned directly
 */
export async function requireAuth(): Promise<AuthUser> {
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
