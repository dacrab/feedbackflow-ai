/**
 * Ingest service for processing feedback from sources
 */

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  feedbackAnalyses,
  feedbackItems,
  ingestRuns,
  userSettings,
  userSources,
} from "@/db/schema";
import { decrypt } from "@/lib/crypto";
import { analyzeFeedback } from "@/lib/llm";
import { notifyHighSeverityFeedback } from "@/lib/services/notification-service";
import { getDateNHoursAgo } from "@/lib/utils/date";
import { fetchGithubIssues, type GithubIssue } from "./github-service";

interface UserSource {
  id: string;
  userId: string;
  type: string;
  config: { repo?: string } | null;
  secretCipher: string | null;
}

interface IngestResult {
  fetched: number;
  inserted: number;
  analyzed: number;
}

async function getUserLLMOpts(userId: string) {
  const [settings] = await db
    .select({
      provider: userSettings.provider,
      model: userSettings.model,
      apiKeyCipher: userSettings.apiKeyCipher,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!settings) {
    return undefined;
  }

  const apiKey = settings.apiKeyCipher ? decrypt(settings.apiKeyCipher) : undefined;
  return {
    provider: settings.provider as "google" | "openai" | "anthropic",
    model: settings.model,
    ...(apiKey && { apiKey }),
  };
}

async function getLatestTimestamp(userId: string): Promise<string> {
  const [row] = await db
    .select({ ts: feedbackItems.originalTimestamp })
    .from(feedbackItems)
    .where(and(eq(feedbackItems.userId, userId), eq(feedbackItems.source, "github")))
    .orderBy(desc(feedbackItems.originalTimestamp))
    .limit(1);

  // On first run, fetch issues from last 30 days instead of 24 hours
  if (!row?.ts) {
    return getDateNHoursAgo(24 * 30);
  }
  return row.ts instanceof Date ? row.ts.toISOString() : row.ts;
}

function issuesToRows(issues: Array<GithubIssue>, userId: string) {
  return issues.map((i) => ({
    userId,
    source: "github" as const,
    externalId: String(i.id),
    rawContent: `${i.title}\n\n${i.body ?? ""}`.slice(0, 15000),
    originalTimestamp: new Date(i.created_at),
  }));
}

async function filterNewItems(rows: ReturnType<typeof issuesToRows>, userId: string) {
  if (rows.length === 0) {
    return [];
  }

  const externalIds = rows.map((r) => r.externalId);
  const existing = await db
    .select({ externalId: feedbackItems.externalId })
    .from(feedbackItems)
    .where(
      and(
        eq(feedbackItems.userId, userId),
        eq(feedbackItems.source, "github"),
        inArray(feedbackItems.externalId, externalIds),
      ),
    );

  const existingSet = new Set(existing.map((e) => e.externalId));
  return rows.filter((r) => !existingSet.has(r.externalId));
}

async function insertItems(items: ReturnType<typeof issuesToRows>) {
  if (items.length === 0) {
    return [];
  }
  return db
    .insert(feedbackItems)
    .values(items)
    .returning({ id: feedbackItems.id, rawContent: feedbackItems.rawContent });
}

async function getUnanalyzedItems(userId: string, limit = 50) {
  return db
    .select({
      id: feedbackItems.id,
      rawContent: feedbackItems.rawContent,
    })
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackItems.id, feedbackAnalyses.feedbackItemId))
    .where(and(eq(feedbackItems.userId, userId), isNull(feedbackAnalyses.id)))
    .limit(limit);
}

async function analyzeAndStore(
  items: Array<{ id: string; rawContent: string }>,
  userId: string,
  llmOpts: Awaited<ReturnType<typeof getUserLLMOpts>>,
): Promise<number> {
  let count = 0;

  for (const item of items) {
    try {
      const analysis = await analyzeFeedback(item.rawContent, 2, llmOpts);

      await db
        .insert(feedbackAnalyses)
        .values({
          userId,
          feedbackItemId: item.id,
          sentiment: analysis.sentiment,
          topics: analysis.topics,
          severityScore: analysis.severity_score,
          summary: analysis.summary,
        })
        .onConflictDoUpdate({
          target: feedbackAnalyses.feedbackItemId,
          set: {
            sentiment: analysis.sentiment,
            topics: analysis.topics,
            severityScore: analysis.severity_score,
            summary: analysis.summary,
          },
        });

      count++;

      if (analysis.severity_score >= 4) {
        await notifyHighSeverityFeedback(userId, { ...analysis, status: "New" });
      }
    } catch (err) {
      // Log error for debugging, then skip
      const msg = err instanceof Error ? err.message : String(err);
      // biome-ignore lint/suspicious/noConsole: needed for debugging LLM errors
      console.error(`[Ingest] Failed to analyze item ${item.id}:`, msg);
    }
  }

  return count;
}

async function processSource(
  source: UserSource,
  llmOptsCache: Map<string, Promise<Awaited<ReturnType<typeof getUserLLMOpts>>>>,
): Promise<IngestResult> {
  const repo = source.config?.repo;
  if (source.type !== "github" || !repo) {
    return { fetched: 0, inserted: 0, analyzed: 0 };
  }

  const { userId, secretCipher } = source;
  const token = secretCipher ? decrypt(secretCipher) : undefined;
  const sinceISO = await getLatestTimestamp(userId);

  const issues = await fetchGithubIssues(repo, sinceISO, token);
  const rows = issuesToRows(issues, userId);
  const newItems = await filterNewItems(rows, userId);
  const inserted = await insertItems(newItems);

  const [run] = await db
    .insert(ingestRuns)
    .values({ userId, fetched: issues.length })
    .returning({ id: ingestRuns.id });

  let llmOptsPromise = llmOptsCache.get(userId);
  if (!llmOptsPromise) {
    llmOptsPromise = getUserLLMOpts(userId);
    llmOptsCache.set(userId, llmOptsPromise);
  }

  // Also get any previously inserted but unanalyzed items
  const unanalyzed = await getUnanalyzedItems(userId);
  const toAnalyze = [...inserted, ...unanalyzed];

  const analyzed = await analyzeAndStore(toAnalyze, userId, await llmOptsPromise);

  if (run?.id) {
    await db
      .update(ingestRuns)
      .set({ ok: true, finishedAt: new Date(), inserted: inserted.length, analyzed })
      .where(eq(ingestRuns.id, run.id));
  }

  return { fetched: issues.length, inserted: inserted.length, analyzed };
}

export async function runIngest(): Promise<IngestResult> {
  const sources = await db
    .select({
      id: userSources.id,
      userId: userSources.userId,
      type: userSources.type,
      config: userSources.config,
      secretCipher: userSources.secretCipher,
    })
    .from(userSources)
    .where(eq(userSources.enabled, true));

  const llmOptsCache = new Map<string, Promise<Awaited<ReturnType<typeof getUserLLMOpts>>>>();
  const totals: IngestResult = { fetched: 0, inserted: 0, analyzed: 0 };

  for (const source of sources as Array<UserSource>) {
    const result = await processSource(source, llmOptsCache);
    totals.fetched += result.fetched;
    totals.inserted += result.inserted;
    totals.analyzed += result.analyzed;
  }

  return totals;
}
