import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userSources } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { successResponse, withAuthDelete, withAuthParams } from "@/lib/api";

export const PATCH = withAuthParams(async (req, params, user) => {
  const { repo, token, enabled } = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof enabled === "boolean") updates["enabled"] = enabled;
  if (typeof repo === "string") updates["config"] = { repo };
  if (typeof token === "string") updates["secretCipher"] = token ? encrypt(token) : null;

  await db.update(userSources).set(updates).where(and(eq(userSources.id, params.id), eq(userSources.userId, user.id)));
  return successResponse({ ok: true });
});

export const DELETE = withAuthDelete(async (params, user) => {
  await db.delete(userSources).where(and(eq(userSources.id, params.id), eq(userSources.userId, user.id)));
  return successResponse({ ok: true });
});
