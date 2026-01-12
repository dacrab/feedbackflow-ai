import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userSources } from "@/db/schema";
import {
  isErrorResponse,
  successResponse,
  validateBody,
  withAuthGet,
  withAuthRequest,
} from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { runIngest } from "@/lib/services/ingest-service";
import { CreateSourceSchema } from "@/lib/validations";

export const GET = withAuthGet(async (user) => {
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
  return successResponse(rows);
});

export const POST = withAuthRequest(async (req, user) => {
  const data = await validateBody(req, CreateSourceSchema);
  if (isErrorResponse(data)) return data;

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
  return successResponse(row);
});
