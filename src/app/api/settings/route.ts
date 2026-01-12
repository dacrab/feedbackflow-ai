import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import {
  isErrorResponse,
  successResponse,
  validateBody,
  withAuthGet,
  withAuthRequest,
} from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import type { LLMProvider } from "@/lib/types";
import { SettingsSchema } from "@/lib/validations";

export const GET = withAuthGet(async (user) => {
  const [row] = await db
    .select({
      provider: userSettings.provider,
      model: userSettings.model,
      apiKeyCipher: userSettings.apiKeyCipher,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  return successResponse({
    provider: (row?.provider as LLMProvider | null) ?? null,
    model: row?.model ?? null,
    hasKey: Boolean(row?.apiKeyCipher),
  });
});

export const POST = withAuthRequest(async (req, user) => {
  const data = await validateBody(req, SettingsSchema);
  if (isErrorResponse(data)) return data;

  const apiKeyCipher = encrypt(data.apiKey);

  await db
    .insert(userSettings)
    .values({ userId: user.id, provider: data.provider, model: data.model, apiKeyCipher })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { provider: data.provider, model: data.model, apiKeyCipher },
    });

  return successResponse({ ok: true });
});
