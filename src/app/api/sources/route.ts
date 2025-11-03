import { z } from "zod";
import { encrypt } from "@/lib/crypto";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { errorResponse, requireAuth, successResponse } from "@/lib/utils/api";
import { transformRowWithSecret } from "@/lib/utils/data";

const CreateBody = z.object({
  type: z.literal("github"),
  repo: z.string().min(3),
  token: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const supa = await createRouteHandlerClient();
    const { data, error } = await supa
      .from("user_sources")
      .select("id, type, config, enabled, secret_cipher")
      .order("created_at", { ascending: false });
    if (error) return errorResponse(error.message, 500);

    type Row = {
      id: string;
      type: string;
      config: { repo?: string } | null;
      enabled: boolean;
      secret_cipher: string | null;
    };
    return successResponse(((data || []) as Row[]).map(transformRowWithSecret));
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(String(error), 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const json = await req.json();
    const parsed = CreateBody.safeParse(json);
    if (!parsed.success) return errorResponse(parsed.error.message, 400);
    const { type, repo, token, enabled = true } = parsed.data;
    const supa = await createRouteHandlerClient();
    const { data, error } = await supa
      .from("user_sources")
      .insert({
        user_id: user.id,
        type,
        config: { repo },
        secret_cipher: token ? encrypt(token) : null,
        enabled,
      })
      .select("id, type, config, enabled, secret_cipher")
      .single();
    if (error) return errorResponse(error.message, 500);
    return successResponse(transformRowWithSecret(data));
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(String(error), 500);
  }
}
