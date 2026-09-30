"use server";

import { captureException } from "@sentry/nextjs";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { feedbackItems, userSources } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { runIngest } from "@/lib/services/ingest-service";
import { uuidSchema } from "@/lib/types";
import { isUniqueViolation, parse, requireUser, secretSchema } from "./guard";

const repoSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "invalid repo format (owner/repo)");
const tokenSchema = secretSchema.min(1);
const patchSchema = z.object({ enabled: z.boolean() });

/** Keeps the fire-and-forget ingest after an add inside the callback window. */
const INGEST_MAX_ITEMS = 20;

export async function addSource(repoRaw: string, token?: string) {
  const userId = await requireUser();
  const repo = parse(repoSchema, repoRaw);
  const ghToken = token ? parse(tokenSchema, token) : undefined;

  const source = await insertSource(userId, repo, ghToken);

  after(() => {
    // Detached ingest of just this source; cron covers the rest.
    runIngest({ userId, sourceId: source.id, maxItems: INGEST_MAX_ITEMS }).catch((e) =>
      captureException(e),
    );
  });
  revalidatePath("/settings");
}

/** The unique index on (user_id, repo) is the real guard against duplicates: a
 *  concurrent double-submit becomes a violation, not a second row. */
async function insertSource(userId: string, repo: string, token: string | undefined) {
  try {
    const [row] = await db
      .insert(userSources)
      .values({
        userId,
        type: "github",
        config: { repo },
        secretCipher: token ? encrypt(token) : null,
      })
      .returning({ id: userSources.id });
    if (!row) throw new Error("failed to add source");
    return row;
  } catch (err) {
    if (isUniqueViolation(err)) throw new Error("that repo is already added");
    throw err;
  }
}

export async function updateSource(id: string, data: { enabled?: boolean }) {
  const userId = await requireUser();
  const sourceId = parse(uuidSchema, id);
  const { enabled } = parse(patchSchema, data);
  await db
    .update(userSources)
    .set({ enabled })
    .where(and(eq(userSources.id, sourceId), eq(userSources.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteSource(id: string) {
  const userId = await requireUser();
  const sourceId = parse(uuidSchema, id);

  const [source] = await db
    .select({ config: userSources.config })
    .from(userSources)
    .where(and(eq(userSources.id, sourceId), eq(userSources.userId, userId)))
    .limit(1);
  if (!source) return;

  // Items are keyed `${repo}#${issueId}`, so the prefix identifies exactly this
  // source's rows; without this a removed repo lives on in the inbox and
  // dashboard. feedback_analyses cascades from feedback_items.
  await db.transaction(async (tx) => {
    await tx
      .delete(feedbackItems)
      .where(
        and(
          eq(feedbackItems.userId, userId),
          sql`${feedbackItems.externalId} LIKE ${`${source.config.repo}#%`}`,
        ),
      );
    await tx.delete(userSources).where(eq(userSources.id, sourceId));
  });

  revalidatePath("/settings");
}
