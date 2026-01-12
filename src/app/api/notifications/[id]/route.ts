import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { successResponse, withAuthDelete, withAuthParams } from "@/lib/api";

export const PATCH = withAuthParams(async (req, params, user) => {
  const { webhook, enabled } = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof enabled === "boolean") updates["enabled"] = enabled;
  if (typeof webhook === "string") updates["secretCipher"] = webhook ? encrypt(webhook) : null;

  await db.update(userNotifications).set(updates).where(and(eq(userNotifications.id, params.id), eq(userNotifications.userId, user.id)));
  return successResponse({ ok: true });
});

export const DELETE = withAuthDelete(async (params, user) => {
  await db.delete(userNotifications).where(and(eq(userNotifications.id, params.id), eq(userNotifications.userId, user.id)));
  return successResponse({ ok: true });
});
