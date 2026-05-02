import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import type { NewUserNotification } from "@/db/schema";
import { userNotifications } from "@/db/schema";
import { validateBody, withAuth } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { UpdateNotificationSchema } from "@/lib/validations";

export const PATCH = withAuth(async (req, ctx, user) => {
  const data = await validateBody(req, UpdateNotificationSchema);

  const params = await ctx.params;
  if (!params) {
    return Response.json({ error: "Missing params" }, { status: 400 });
  }
  const id = params["id"];
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const updates: Partial<NewUserNotification> = {};
  if (typeof data.enabled === "boolean") updates.enabled = data.enabled;
  if (typeof data.webhook === "string")
    updates.secretCipher = data.webhook ? encrypt(data.webhook) : null;

  await db
    .update(userNotifications)
    .set(updates)
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, user.id)));
  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth(async (_req, ctx, user) => {
  const params = await ctx.params;
  if (!params) {
    return Response.json({ error: "Missing params" }, { status: 400 });
  }
  const id = params["id"];
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  await db
    .delete(userNotifications)
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, user.id)));
  return NextResponse.json({ ok: true });
});
