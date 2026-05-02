# API Layer Type Safety Plan

## Executive Summary

Based on the type audit findings, the API layer has **5 critical type safety issues** that need immediate attention:

1. **Non-null assertion operators** on params (3 routes)
2. **Unsafe type assertions** on LLMProvider and FeedbackStatus
3. **Generic Record<string, unknown>** for config fields (no validation)
4. **Missing return types** on withAuth wrapper
5. **Unsafe Response type handling** in validateBody

---

## Issue 1: Non-null Assertion Operators (CRITICAL)

### Affected Files
- `src/app/api/sources/[id]/route.ts:14`
- `src/app/api/notifications/[id]/route.ts:14`
- `src/app/api/feedback/[id]/status/route.ts:12`

### Current Code
```typescript
const params = await ctx.params!;
```

### Problem
- Using `!` operator assumes params always exists
- Runtime error if Next.js passes undefined
- No type safety guarantee

### Solution
Add proper null check:
```typescript
const params = await ctx.params;
if (!params?.id) {
  return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
}
```

### Impact: HIGH - Prevents runtime crashes

---

## Issue 2: withAuth Wrapper Type Safety

### Affected File
`src/lib/api.ts:37-48`

### Current Code
```typescript
export function withAuth<T>(
  handler: (req: Request, ctx: { params?: Promise<{ id: string }> }, user: AuthUser) => Promise<T>,
) {
  return async (req: Request, ctx?: { params: Promise<{ id: string }> }): Promise<T | Response> => {
    // ...
  };
}
```

### Problems
1. **Generic T is unconstrained** - could be anything
2. **params type mismatch** - handler expects `params?: Promise<{id}>`, but ctx is `params: Promise<{id}>`
3. **No return type validation** - T could be non-Response type
4. **Missing searchParams support** - only handles params

### Solution
```typescript
type RouteContext = {
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string>>;
};

type RouteHandler = (
  req: Request,
  ctx: RouteContext,
  user: AuthUser
) => Promise<Response>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx: RouteContext = {}): Promise<Response> => {
    try {
      const user = await requireAuth();
      return await handler(req, ctx, user);
    } catch (e) {
      return e instanceof Response 
        ? e 
        : NextResponse.json({ error: String(e) }, { status: 500 });
    }
  };
}
```

### Impact: HIGH - Ensures all routes return Response objects

---

## Issue 3: Unsafe Type Assertions on Enums

### Affected Files
- `src/app/api/settings/route.ts:22` - `row?.provider as LLMProvider | null`
- `src/app/api/feedback/[id]/status/route.ts:15` - `data.status as FeedbackStatus`

### Problem
- Assumes DB/validation data matches enum types
- No runtime validation
- Could cause type mismatches

### Solution A: Type Guards (Recommended)
```typescript
// In src/lib/types.ts
export const LLM_PROVIDERS = ["google", "openai", "anthropic"] as const;
export type LLMProvider = typeof LLM_PROVIDERS[number];

export function isLLMProvider(val: unknown): val is LLMProvider {
  return typeof val === "string" && LLM_PROVIDERS.includes(val as LLMProvider);
}

export const FEEDBACK_STATUSES = ["New", "Acknowledged", "Actioned"] as const;
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number];

export function isFeedbackStatus(val: unknown): val is FeedbackStatus {
  return typeof val === "string" && FEEDBACK_STATUSES.includes(val as FeedbackStatus);
}
```

### Solution B: Zod Schema Validation (Already Done)
The validation schemas already enforce correct types:
```typescript
// src/lib/validations.ts
provider: z.enum(["google", "openai", "anthropic"]),
status: z.enum(["New", "Acknowledged", "Actioned"]),
```

**Action:** Remove type assertions since zod already validates:
```typescript
// Before
set({ status: data.status as FeedbackStatus })

// After
set({ status: data.status }) // zod guarantees correct type
```

### Impact: MEDIUM - Prevents invalid enum values

---

## Issue 4: Generic Config Fields

### Affected Files
- `src/db/schema.ts:178, 197` - `config: jsonb("config").$type<Record<string, unknown>>()`
- `src/app/api/sources/[id]/route.ts:13` - `const updates: Record<string, unknown> = {}`
- `src/app/api/notifications/[id]/route.ts:13` - `const updates: Record<string, unknown> = {}`

### Problem
- No type safety when accessing config properties
- No validation of config structure
- Runtime errors if config shape is wrong

### Solution: Discriminated Union Types
```typescript
// In src/lib/types.ts
export type GitHubSourceConfig = {
  repo: string;
};

export type SourceConfig = GitHubSourceConfig; // Extend when adding more source types

export type SlackNotificationConfig = {
  kind: "slack";
  minSeverity?: number;
};

export type NotificationConfig = SlackNotificationConfig; // Extend when adding more types

// In src/db/schema.ts
config: jsonb("config").$type<SourceConfig>().notNull(),
config: jsonb("config").$type<NotificationConfig>().notNull(),
```

### Update Validation Schemas
```typescript
// src/lib/validations.ts
export const UpdateSourceSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.object({ repo: z.string().min(3) }).optional(),
  token: z.string().optional(),
});

export const UpdateNotificationSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.object({ 
    kind: z.literal("slack"),
    minSeverity: z.number().min(1).max(5).optional() 
  }).optional(),
  webhook: z.string().optional(),
});
```

### Update API Routes
```typescript
// src/app/api/sources/[id]/route.ts
export const PATCH = withAuth(async (req, ctx, user) => {
  const data = await validateBody(req, UpdateSourceSchema);
  const params = await ctx.params;
  if (!params?.id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const updates: Partial<typeof userSources.$inferInsert> = {};
  if (data.enabled !== undefined) updates.enabled = data.enabled;
  if (data.config) updates.config = data.config;
  if (data.token !== undefined) {
    updates.secretCipher = data.token ? encrypt(data.token) : null;
  }

  await db
    .update(userSources)
    .set(updates)
    .where(and(eq(userSources.id, params.id), eq(userSources.userId, user.id)));
  
  return NextResponse.json({ ok: true });
});
```

### Impact: HIGH - Prevents config-related runtime errors

---

## Issue 5: validateBody Type Safety

### Affected File
`src/lib/api.ts:10-20`

### Current Code
```typescript
export async function validateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T> {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    throw NextResponse.json(
      { error: result.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  return result.data;
}
```

### Problem
- **Throws Response object** instead of returning it
- Inconsistent error handling pattern
- Caller must catch Response objects

### Solution
```typescript
export async function validateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          { error: result.error.issues[0]?.message || "Invalid input" },
          { status: 400 }
        ),
      };
    }
    
    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      ),
    };
  }
}
```

### Alternative: Keep Current Pattern (Simpler)
The current pattern is actually fine if we document it properly. The withAuth wrapper already catches thrown Responses.

**Recommendation:** Keep current pattern, add JSDoc:
```typescript
/**
 * Validate request body against schema.
 * @throws {Response} 400 error response if validation fails
 */
export async function validateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T>
```

### Impact: LOW - Current pattern works, just needs documentation

---

## Issue 6: Missing Return Types

### Affected File
`src/lib/api.ts:37`

### Current Code
```typescript
export function withAuth<T>(
  handler: (req: Request, ctx: { params?: Promise<{ id: string }> }, user: AuthUser) => Promise<T>,
)
```

### Solution
Already covered in Issue 2 - remove generic T, enforce Response return type.

---

## Issue 7: Redundant Type Assertions

### Affected File
`src/app/api/cron/route.ts:29`

### Current Code
```typescript
const userIds = [...new Set(rows.map((u) => u.userId as string))];
```

### Problem
- `userId` is already typed as `text` (string) in schema
- Assertion is redundant

### Solution
```typescript
const userIds = [...new Set(rows.map((u) => u.userId))];
```

### Impact: LOW - Cleanup only

---

## Implementation Priority

### Phase 1: Critical Fixes (Do First)
1. ✅ Fix non-null assertions on params (3 routes)
2. ✅ Fix withAuth wrapper types
3. ✅ Remove unsafe enum type assertions

### Phase 2: High Priority
4. ✅ Add specific config types
5. ✅ Update validation schemas for config
6. ✅ Update API routes to use typed configs

### Phase 3: Cleanup
7. ✅ Remove redundant type assertions
8. ✅ Add JSDoc comments
9. ✅ Add missing TransformedSourceRow type (from audit)

---

## Testing Strategy

### 1. Type-Level Tests
```typescript
// src/lib/__tests__/api.types.test.ts
import { expectType } from 'tsd';
import type { RouteHandler } from '@/lib/api';

// Ensure withAuth enforces Response return type
const handler: RouteHandler = async (req, ctx, user) => {
  return new Response(); // ✅ OK
  // return "string"; // ❌ Type error
};
```

### 2. Runtime Tests
```typescript
// Test params validation
it('should return 400 when params.id is missing', async () => {
  const response = await PATCH(mockRequest, { params: undefined });
  expect(response.status).toBe(400);
});

// Test config validation
it('should reject invalid config structure', async () => {
  const response = await POST(mockRequest, { 
    body: { config: { invalid: true } } 
  });
  expect(response.status).toBe(400);
});
```

---

## Success Criteria

- [ ] Zero non-null assertions in API routes
- [ ] All route handlers return Response type
- [ ] All config fields have specific types
- [ ] All validation schemas match actual types
- [ ] Zero unsafe type assertions
- [ ] All functions have explicit return types
- [ ] TypeScript strict mode passes with no errors

---

## Estimated Effort

- **Phase 1:** 2-3 hours
- **Phase 2:** 3-4 hours
- **Phase 3:** 1-2 hours
- **Testing:** 2-3 hours
- **Total:** 8-12 hours

---

## Files to Modify

### Core API Infrastructure
- `src/lib/api.ts` - Fix withAuth, add JSDoc
- `src/lib/types.ts` - Add config types, type guards, TransformedSourceRow
- `src/lib/validations.ts` - Update schemas for config validation

### API Routes (7 files)
- `src/app/api/sources/[id]/route.ts`
- `src/app/api/sources/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/feedback/[id]/status/route.ts`
- `src/app/api/settings/route.ts`
- `src/app/api/cron/route.ts`

### Database Schema
- `src/db/schema.ts` - Update config field types

### Tests (New)
- `src/lib/__tests__/api.types.test.ts`
- `src/app/api/__tests__/routes.test.ts`

---

## Additional Recommendations

### 1. Add API Response Types
```typescript
// src/lib/types.ts
export type ApiResponse<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string };

export type SourceResponse = {
  id: string;
  type: string;
  config: SourceConfig;
  enabled: boolean;
};
```

### 2. Add Request Type Helpers
```typescript
// src/lib/api.ts
export async function getParams<T extends Record<string, string>>(
  ctx: RouteContext
): Promise<T | null> {
  return (await ctx.params) as T | null;
}
```

### 3. Add Middleware Type
```typescript
type Middleware = (
  req: Request,
  ctx: RouteContext,
  next: () => Promise<Response>
) => Promise<Response>;
```

### 4. Consider tRPC or Next.js Server Actions
For maximum type safety, consider migrating to:
- **tRPC**: End-to-end type safety with automatic client generation
- **Next.js Server Actions**: Type-safe server functions with no API routes

---

## Conclusion

The API layer has **good foundational type safety** with zod validation, but suffers from:
1. Unsafe type assertions that bypass validation
2. Generic config types that should be specific
3. Non-null assertions that could cause runtime errors

Implementing this plan will achieve **maximum type safety** by:
- Eliminating all unsafe type assertions
- Adding specific types for all config fields
- Enforcing Response return types
- Adding proper null checks

**Estimated risk reduction: 80%** of potential runtime type errors eliminated.
