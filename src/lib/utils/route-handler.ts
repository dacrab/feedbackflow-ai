/**
 * API route handler utilities for Next.js 16
 * Eliminates duplicate error handling patterns
 */

import { errorResponse, requireAuth } from "./api";

/**
 * Wrapper for GET handlers that require authentication
 * Next.js 16 pattern: GET() => Promise<Response>
 */
export function withAuthGet<T>(
  handler: (user: Awaited<ReturnType<typeof requireAuth>>) => Promise<T>,
) {
  return async (): Promise<T | Response> => {
    try {
      const user = await requireAuth();
      return await handler(user);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      return errorResponse(String(error), 500);
    }
  };
}

/**
 * Wrapper for POST/PATCH handlers that require authentication
 * Next.js 16 pattern: POST(req: Request) => Promise<Response>
 */
export function withAuthRequest<T>(
  handler: (req: Request, user: Awaited<ReturnType<typeof requireAuth>>) => Promise<T>,
) {
  return async (req: Request): Promise<T | Response> => {
    try {
      const user = await requireAuth();
      return await handler(req, user);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      return errorResponse(String(error), 500);
    }
  };
}

/**
 * Wrapper for handlers with dynamic params that require authentication
 * Next.js 16 pattern: PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>
 */
export function withAuthParams<T>(
  handler: (
    req: Request,
    params: { id: string },
    user: Awaited<ReturnType<typeof requireAuth>>,
  ) => Promise<T>,
) {
  return async (req: Request, ctx: { params: Promise<{ id: string }> }): Promise<T | Response> => {
    try {
      const user = await requireAuth();
      const params = await ctx.params;
      return await handler(req, params, user);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      return errorResponse(String(error), 500);
    }
  };
}

/**
 * Wrapper for DELETE handlers with params that require authentication
 * Next.js 16 pattern: DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>
 */
export function withAuthDelete<T>(
  handler: (params: { id: string }, user: Awaited<ReturnType<typeof requireAuth>>) => Promise<T>,
) {
  return async (_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<T | Response> => {
    try {
      const user = await requireAuth();
      const params = await ctx.params;
      return await handler(params, user);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      return errorResponse(String(error), 500);
    }
  };
}
