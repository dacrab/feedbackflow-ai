import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { errorResponse, successResponse, withAuthGet, withAuthRequest } from "@/lib/api";
import { CreateNotificationSchema } from "@/lib/validations";

export const GET = withAuthGet(async (user) => {
  const rows = await db
    .select({ id: userNotifications.id, type: userNotifications.type, config: userNotifications.config, enabled: userNotifications.enabled })
    .from(userNotifications)
    .where(eq(userNotifications.userId, user.id))
    .orderBy(desc(userNotifications.createdAt));
  return successResponse(rows);
});

export const POST = withAuthRequest(async (req, user) => {
  const body = await req.json();
  const parsed = CreateNotificationSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Invalid input", 400);

  const { type, webhook } = parsed.data;
  const [row] = await db.insert(userNotifications).values({
    userId: user.id,
    type,
    config: { kind: "slack" },
    secretCipher: encrypt(webhook),
  }).returning({ id: userNotifications.id, type: userNotifications.type, config: userNotifications.config, enabled: userNotifications.enabled });

  return successResponse(row);
});
