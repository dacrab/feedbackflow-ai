import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import {
  isErrorResponse,
  successResponse,
  validateBody,
  withAuthGet,
  withAuthRequest,
} from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { CreateNotificationSchema } from "@/lib/validations";

export const GET = withAuthGet(async (user) => {
  const rows = await db
    .select({
      id: userNotifications.id,
      type: userNotifications.type,
      config: userNotifications.config,
      enabled: userNotifications.enabled,
    })
    .from(userNotifications)
    .where(eq(userNotifications.userId, user.id))
    .orderBy(desc(userNotifications.createdAt));
  return successResponse(rows);
});

export const POST = withAuthRequest(async (req, user) => {
  const data = await validateBody(req, CreateNotificationSchema);
  if (isErrorResponse(data)) return data;

  const { type, webhook } = data;
  const [row] = await db
    .insert(userNotifications)
    .values({
      userId: user.id,
      type,
      config: { kind: "slack" },
      secretCipher: encrypt(webhook),
    })
    .returning({
      id: userNotifications.id,
      type: userNotifications.type,
      config: userNotifications.config,
      enabled: userNotifications.enabled,
    });

  return successResponse(row);
});
