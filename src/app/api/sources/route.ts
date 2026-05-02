import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userSources } from "@/db/schema";
import { validateBody, withAuth } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { runIngest } from "@/lib/services/ingest-service";
import { CreateSourceSchema } from "@/lib/validations";

export const GET = withAuth(async (_req, _ctx, user) => {
  const rows = await db
    .select({
      id: userSources.id,
      type: userSources.type,
      config: userSources.config,
      enabled: userSources.enabled,
    })
    .from(userSources)
    .where(eq(userSources.userId, user.id))
    .orderBy(desc(userSources.createdAt));
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, _ctx, user) => {
  const data = await validateBody(req, CreateSourceSchema);

  const { type, repo, token } = data;
  const [row] = await db
    .insert(userSources)
    .values({
      userId: user.id,
      type,
      config: { repo },
      secretCipher: token ? encrypt(token) : null,
    })
    .returning({
      id: userSources.id,
      type: userSources.type,
      config: userSources.config,
      enabled: userSources.enabled,
    });

  runIngest().catch(console.error);
  return NextResponse.json(row);
});
