import { NextResponse } from "next/server";
import { z } from "zod";
import { encrypt } from "@/lib/crypto";
import { createRouteHandlerClient } from "@/lib/supabase/server";

const CreateBody = z.object({
  type: z.literal("slack"),
  webhook: z.string().url(),
  enabled: z.boolean().optional(),
});

export async function GET() {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supa
    .from("user_notifications")
    .select("id, type, config, enabled, secret_cipher")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = {
    id: string;
    type: string;
    config: Record<string, unknown> | null;
    enabled: boolean;
    secret_cipher: string | null;
  };
  return NextResponse.json(
    ((data || []) as Row[]).map((r) => ({
      id: r.id,
      type: r.type,
      config: r.config,
      enabled: r.enabled,
      hasSecret: Boolean(r.secret_cipher),
    })),
  );
}

export async function POST(req: Request) {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const json = await req.json();
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { type, webhook, enabled = true } = parsed.data;
  const { data, error } = await supa
    .from("user_notifications")
    .insert({
      user_id: auth.user.id,
      type,
      config: { kind: "slack" },
      secret_cipher: encrypt(webhook),
      enabled,
    })
    .select("id, type, config, enabled, secret_cipher")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    id: data.id,
    type: data.type,
    config: data.config,
    enabled: data.enabled,
    hasSecret: Boolean(data.secret_cipher),
  });
}
