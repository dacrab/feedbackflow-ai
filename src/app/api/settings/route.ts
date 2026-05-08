import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { validateBody, withAuth } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { getUserSettings } from "@/lib/services/settings-service";
import { SettingsSchema } from "@/lib/validations";

export const GET = withAuth(async (_req, _ctx, user) => {
  const settings = await getUserSettings(user.id);
  return NextResponse.json(settings);
});

export const POST = withAuth(async (req, _ctx, user) => {
  const data = await validateBody(req, SettingsSchema);
  const apiKeyCipher = encrypt(data.apiKey);

  await db
    .insert(userSettings)
    .values({ userId: user.id, provider: data.provider, model: data.model, apiKeyCipher })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { provider: data.provider, model: data.model, apiKeyCipher },
    });

  return NextResponse.json({ ok: true });
});
