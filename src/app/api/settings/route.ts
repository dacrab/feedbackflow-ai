import { NextResponse } from "next/server";
import { z } from "zod";
import { encrypt } from "@/lib/crypto";
import { createRouteHandlerClient } from "@/lib/supabase/server";

const Body = z.object({
  provider: z.enum(["google", "openai", "anthropic"]),
  model: z.string().min(1),
  apiKey: z.string().min(5),
});

export async function GET() {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await supa
    .from("user_settings")
    .select("provider, model, api_key_cipher")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    provider: data?.provider ?? null,
    model: data?.model ?? null,
    hasKey: Boolean(data?.api_key_cipher),
  });
}

export async function POST(req: Request) {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { provider, model, apiKey } = parsed.data;
  const api_key_cipher = encrypt(apiKey);
  const { error } = await supa
    .from("user_settings")
    .upsert({ user_id: auth.user.id, provider, model, api_key_cipher }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
