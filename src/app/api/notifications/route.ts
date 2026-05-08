import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { validateBody, withAuth } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { getUserNotifications } from "@/lib/services/settings-service";
import { CreateNotificationSchema } from "@/lib/validations";

export const GET = withAuth(async (_req, _ctx, user) => {
  return NextResponse.json(await getUserNotifications(user.id));
});

export const POST = withAuth(async (req, _ctx, user) => {
  const data = await validateBody(req, CreateNotificationSchema);

  const { type, webhook } = data;
  const [row] = await db
    .insert(userNotifications)
    .values({
      userId: user.id,
      type,
      config: {},
      secretCipher: encrypt(webhook),
    })
    .returning({
      id: userNotifications.id,
      type: userNotifications.type,
      config: userNotifications.config,
      enabled: userNotifications.enabled,
    });

  return NextResponse.json(row);
});
