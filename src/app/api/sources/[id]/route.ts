import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import type { NewUserSource } from "@/db/schema";
import { userSources } from "@/db/schema";
import { validateBody, withAuth } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { UpdateSourceSchema } from "@/lib/validations";

export const PATCH = withAuth(async (req, ctx, user) => {
  const data = await validateBody(req, UpdateSourceSchema);
  const id = (await ctx.params!)["id"] as string;

  const updates: Partial<NewUserSource> = {};
  if (typeof data.enabled === "boolean") updates.enabled = data.enabled;
  if (typeof data.repo === "string") updates.config = { repo: data.repo };
  if (typeof data.token === "string")
    updates.secretCipher = data.token ? encrypt(data.token) : null;

  await db
    .update(userSources)
    .set(updates)
    .where(and(eq(userSources.id, id), eq(userSources.userId, user.id)));
  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth(async (_req, ctx, user) => {
  const id = (await ctx.params!)["id"] as string;
  await db.delete(userSources).where(and(eq(userSources.id, id), eq(userSources.userId, user.id)));
  return NextResponse.json({ ok: true });
});
