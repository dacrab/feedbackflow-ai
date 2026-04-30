import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userSources } from "@/db/schema";
import {
  isErrorResponse,
  successResponse,
  validateBody,
  withAuthDelete,
  withAuthParams,
} from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { UpdateSourceSchema } from "@/lib/validations";

export const PATCH = withAuthParams(async (req, params, user) => {
  const data = await validateBody(req, UpdateSourceSchema);
  if (isErrorResponse(data)) return data;

  const updates: Record<string, unknown> = {};
  if (typeof data.enabled === "boolean") updates["enabled"] = data.enabled;
  if (typeof data.repo === "string") updates["config"] = { repo: data.repo };
  if (typeof data.token === "string")
    updates["secretCipher"] = data.token ? encrypt(data.token) : null;

  await db
    .update(userSources)
    .set(updates)
    .where(and(eq(userSources.id, params.id), eq(userSources.userId, user.id)));
  return successResponse({ ok: true });
});

export const DELETE = withAuthDelete(async (params, user) => {
  await db
    .delete(userSources)
    .where(and(eq(userSources.id, params.id), eq(userSources.userId, user.id)));
  return successResponse({ ok: true });
});
