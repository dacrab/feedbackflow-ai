import { userNotifications } from "@/db/schema";
import {
  isErrorResponse,
  successResponse,
  validateBody,
  withAuthDelete,
  withAuthParams,
} from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { deleteUserRow, updateUserRow } from "@/lib/db/queries";
import { UpdateNotificationSchema } from "@/lib/validations";

export const PATCH = withAuthParams(async (req, params, user) => {
  const data = await validateBody(req, UpdateNotificationSchema);
  if (isErrorResponse(data)) return data;

  const updates: Record<string, unknown> = {};
  if (typeof data.enabled === "boolean") updates["enabled"] = data.enabled;
  if (typeof data.webhook === "string")
    updates["secretCipher"] = data.webhook ? encrypt(data.webhook) : null;

  await updateUserRow(userNotifications, params.id, user.id, updates);
  return successResponse({ ok: true });
});

export const DELETE = withAuthDelete(async (params, user) => {
  await deleteUserRow(userNotifications, params.id, user.id);
  return successResponse({ ok: true });
});
