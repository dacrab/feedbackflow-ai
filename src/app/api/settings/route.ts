import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import type { LLMProvider } from "@/lib/types";
import { errorResponse, successResponse } from "@/lib/utils/api";
import { withAuthGet, withAuthRequest } from "@/lib/utils/route-handler";

const SettingsBody = z.object({
  provider: z.enum(["google", "openai", "anthropic"]),
  model: z.string().min(1),
  apiKey: z.string().min(5),
});

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
  const json = await req.json();
  const parsed = SettingsBody.safeParse(json);
  if (!parsed.success) return errorResponse(parsed.error.message, 400);

  const { provider, model, apiKey } = parsed.data;
  const apiKeyCipher = encrypt(apiKey);

  await db
    .insert(userSettings)
    .values({ userId: user.id, provider, model, apiKeyCipher })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { provider, model, apiKeyCipher },
    });

  return successResponse({ ok: true });
});
