import { z } from "zod";
import { encrypt } from "@/lib/crypto";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { errorResponse, requireAuth, successResponse } from "@/lib/utils/api";

const Body = z.object({
  provider: z.enum(["google", "openai", "anthropic"]),
  model: z.string().min(1),
  apiKey: z.string().min(5),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const supa = await createRouteHandlerClient();
    const { data, error } = await supa
      .from("user_settings")
      .select("provider, model, api_key_cipher")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return errorResponse(error.message, 500);
    return successResponse({
      provider: data?.provider ?? null,
      model: data?.model ?? null,
      hasKey: Boolean(data?.api_key_cipher),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(String(error), 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) return errorResponse(parsed.error.message, 400);
    const { provider, model, apiKey } = parsed.data;
    const api_key_cipher = encrypt(apiKey);
    const supa = await createRouteHandlerClient();
    const { error } = await supa
      .from("user_settings")
      .upsert({ user_id: user.id, provider, model, api_key_cipher }, { onConflict: "user_id" });
    if (error) return errorResponse(error.message, 500);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(String(error), 500);
  }
}
