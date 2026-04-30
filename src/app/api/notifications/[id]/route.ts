import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import {
  isErrorResponse,
  successResponse,
  validateBody,
  withAuthDelete,
  withAuthParams,
} from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { UpdateNotificationSchema } from "@/lib/validations";

export const PATCH = withAuthParams(async (req, params, user) => {
  const data = await validateBody(req, UpdateNotificationSchema);
  if (isErrorResponse(data)) return data;

  const updates: Record<string, unknown> = {};
  if (typeof data.enabled === "boolean") updates["enabled"] = data.enabled;
  if (typeof data.webhook === "string")
    updates["secretCipher"] = data.webhook ? encrypt(data.webhook) : null;

  await db
    .update(userNotifications)
    .set(updates)
    .where(and(eq(userNotifications.id, params.id), eq(userNotifications.userId, user.id)));
  return successResponse({ ok: true });
});

export const DELETE = withAuthDelete(async (params, user) => {
  await db
    .delete(userNotifications)
    .where(and(eq(userNotifications.id, params.id), eq(userNotifications.userId, user.id)));
  return successResponse({ ok: true });
});
