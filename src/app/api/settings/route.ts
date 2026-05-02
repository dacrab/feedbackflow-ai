import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { validateBody, withAuth } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { isLLMProvider } from "@/lib/types";
import { SettingsSchema } from "@/lib/validations";

export const GET = withAuth(async (_req, _ctx, user) => {
  const [row] = await db
    .select({
      provider: userSettings.provider,
      model: userSettings.model,
      apiKeyCipher: userSettings.apiKeyCipher,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  return NextResponse.json({
    provider: row?.provider && isLLMProvider(row.provider) ? row.provider : null,
    model: row?.model ?? null,
    hasKey: Boolean(row?.apiKeyCipher),
  });
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
