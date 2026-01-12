import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userSources } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { runIngest } from "@/lib/services/ingest-service";
import { errorResponse, successResponse, withAuthGet, withAuthRequest } from "@/lib/api";
import { CreateSourceSchema } from "@/lib/validations";

export const GET = withAuthGet(async (user) => {
  const rows = await db
    .select({ id: userSources.id, type: userSources.type, config: userSources.config, enabled: userSources.enabled })
    .from(userSources)
    .where(eq(userSources.userId, user.id))
    .orderBy(desc(userSources.createdAt));
  return successResponse(rows);
});

export const POST = withAuthRequest(async (req, user) => {
  const body = await req.json();
  const parsed = CreateSourceSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Invalid input", 400);

  const { type, repo, token } = parsed.data;
  const [row] = await db.insert(userSources).values({
    userId: user.id,
    type,
    config: { repo },
    secretCipher: token ? encrypt(token) : null,
  }).returning({ id: userSources.id, type: userSources.type, config: userSources.config, enabled: userSources.enabled });

  runIngest().catch(() => {});
  return successResponse(row);
});
