import { z } from "zod";
import { encrypt } from "@/lib/crypto";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import type { LLMProvider } from "@/lib/types";
import { errorResponse, successResponse } from "@/lib/utils/api";
import { withAuthGet, withAuthRequest } from "@/lib/utils/route-handler";

const SettingsBody = z.object({
  provider: z.enum(["google", "openai", "anthropic"]),
  model: z.string().min(1),
  apiKey: z.string().min(5),
});

export const GET = withAuthGet(async (user) => {
  const supa = await createRouteHandlerClient();
  const { data, error } = await supa
    .from("user_settings")
    .select("provider, model, api_key_cipher")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return successResponse({
    provider: (data?.provider as LLMProvider | null) ?? null,
    model: data?.model ?? null,
    hasKey: Boolean(data?.api_key_cipher),
  });
});

export const POST = withAuthRequest(async (req, user) => {
  const json = await req.json();
  const parsed = SettingsBody.safeParse(json);
  if (!parsed.success) return errorResponse(parsed.error.message, 400);

  const { provider, model, apiKey } = parsed.data;
  const api_key_cipher = encrypt(apiKey);
  const supa = await createRouteHandlerClient();
  const { error } = await supa
    .from("user_settings")
    .upsert({ user_id: user.id, provider, model, api_key_cipher }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
  return successResponse({ ok: true });
});
