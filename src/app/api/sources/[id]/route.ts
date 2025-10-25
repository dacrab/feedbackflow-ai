import { NextResponse } from "next/server";
import { z } from "zod";
import { encrypt } from "@/lib/crypto";
import { createRouteHandlerClient } from "@/lib/supabase/server";

const PatchBody = z.object({
  enabled: z.boolean().optional(),
  repo: z.string().min(3).optional(),
  token: z.string().optional(), // empty string clears
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json();
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const upd: Record<string, unknown> = {};
  if (typeof parsed.data.enabled === "boolean") upd["enabled"] = parsed.data.enabled;
  if (typeof parsed.data.repo === "string") upd["config"] = { repo: parsed.data.repo };
  if (typeof parsed.data.token === "string")
    upd["secret_cipher"] = parsed.data.token ? encrypt(parsed.data.token) : null;
  const { error } = await supa.from("user_sources").update(upd).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { error } = await supa.from("user_sources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
