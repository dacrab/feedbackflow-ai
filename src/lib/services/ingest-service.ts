import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import type { GitHubSourceConfig } from "@/db/schema";
import {
  feedbackAnalyses,
  feedbackItems,
  ingestRuns,
  userSettings,
  userSources,
} from "@/db/schema";
import {
  DEFAULT_ANALYSIS_BATCH_SIZE,
  HIGH_SEVERITY_THRESHOLD,
  INITIAL_FETCH_DAYS,
  MAX_RAW_CONTENT_LENGTH,
} from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import { analyzeFeedback } from "@/lib/llm";
import { notifyHighSeverityFeedback } from "@/lib/services/notification-service";
import { getDateNHoursAgo } from "@/lib/utils";
import { fetchGithubIssues } from "./github-service";

type LLMOpts =
  | { provider: "google" | "openai" | "anthropic"; model?: string; apiKey?: string }
  | undefined;

function isGitHubConfig(config: GitHubSourceConfig): config is GitHubSourceConfig {
  return "repo" in config && typeof config.repo === "string";
}

export async function getUserLLMOpts(userId: string): Promise<LLMOpts> {
  const [s] = await db
    .select({
      provider: userSettings.provider,
      model: userSettings.model,
      apiKeyCipher: userSettings.apiKeyCipher,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  if (!s) return undefined;
  const apiKey = s.apiKeyCipher ? decrypt(s.apiKeyCipher) : undefined;
  return {
    provider: s.provider as "google" | "openai" | "anthropic",
    ...(s.model && { model: s.model }),
    ...(apiKey && { apiKey }),
  };
}

export async function getLatestTimestamp(userId: string): Promise<string> {
  const [row] = await db
    .select({ ts: feedbackItems.originalTimestamp })
    .from(feedbackItems)
    .where(and(eq(feedbackItems.userId, userId), eq(feedbackItems.source, "github")))
    .orderBy(desc(feedbackItems.originalTimestamp))
    .limit(1);
  if (!row?.ts) return getDateNHoursAgo(24 * INITIAL_FETCH_DAYS);
  return new Date(row.ts).toISOString();
}

export async function getUnanalyzedItems(
  userId: string,
  limit = DEFAULT_ANALYSIS_BATCH_SIZE,
): Promise<Array<{ id: string; rawContent: string }>> {
  return db
    .select({ id: feedbackItems.id, rawContent: feedbackItems.rawContent })
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackItems.id, feedbackAnalyses.feedbackItemId))
    .where(and(eq(feedbackItems.userId, userId), isNull(feedbackAnalyses.id)))
    .limit(limit);
}

export async function analyzeAndStore(
  items: { id: string; rawContent: string }[],
  userId: string,
  llmOpts: LLMOpts,
  onProgress?: (current: number, total: number, summary: string) => void,
): Promise<number> {
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    try {
      const a = await analyzeFeedback(item.rawContent, 2, llmOpts);
      const analysisData = {
        sentiment: a.sentiment,
        topics: a.topics,
        severityScore: a.severity_score,
        summary: a.summary,
      };
      await db
        .insert(feedbackAnalyses)
        .values({ userId, feedbackItemId: item.id, ...analysisData })
        .onConflictDoUpdate({ target: feedbackAnalyses.feedbackItemId, set: analysisData });
      count++;
      onProgress?.(i + 1, items.length, a.summary);
      if (a.severity_score >= HIGH_SEVERITY_THRESHOLD)
        await notifyHighSeverityFeedback(userId, { ...a, status: "New" });
    } catch (err) {
      console.error(`[Ingest] Failed to analyze ${item.id}:`, String(err));
      onProgress?.(i + 1, items.length, `Failed: ${String(err)}`);
    }
  }
  return count;
}

export async function runIngest(): Promise<{
  fetched: number;
  inserted: number;
  analyzed: number;
}> {
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

  const totals = { fetched: 0, inserted: 0, analyzed: 0 };

  for (const src of sources) {
    if (src.type !== "github") continue;

    if (!isGitHubConfig(src.config)) {
      console.warn(`Invalid GitHub config for source ${src.id}`);
      continue;
    }

    const repo = src.config.repo;
    const token = src.secretCipher ? decrypt(src.secretCipher) : undefined;
    const issues = await fetchGithubIssues(repo, await getLatestTimestamp(src.userId), token);

    const rows = issues.map((i) => ({
      userId: src.userId,
      source: "github" as const,
      externalId: String(i.id),
      rawContent: `${i.title}\n\n${i.body ?? ""}`.slice(0, MAX_RAW_CONTENT_LENGTH),
      originalTimestamp: new Date(i.created_at),
    }));

    let newItems: typeof rows = [];
    if (rows.length) {
      const existing = await db
        .select({ externalId: feedbackItems.externalId })
        .from(feedbackItems)
        .where(
          and(
            eq(feedbackItems.userId, src.userId),
            eq(feedbackItems.source, "github"),
            inArray(
              feedbackItems.externalId,
              rows.map((r) => r.externalId),
            ),
          ),
        );
      const set = new Set(existing.map((e) => e.externalId));
      newItems = rows.filter((r) => !set.has(r.externalId));
    }

    const inserted = newItems.length
      ? await db
          .insert(feedbackItems)
          .values(newItems)
          .returning({ id: feedbackItems.id, rawContent: feedbackItems.rawContent })
      : [];

    const [run] = await db
      .insert(ingestRuns)
      .values({ userId: src.userId, fetched: issues.length })
      .returning({ id: ingestRuns.id });

    const unanalyzed = await getUnanalyzedItems(src.userId);
    const analyzed = await analyzeAndStore(
      [...inserted, ...unanalyzed],
      src.userId,
      await getUserLLMOpts(src.userId),
    );

    if (run?.id)
      await db
        .update(ingestRuns)
        .set({ ok: true, finishedAt: new Date(), inserted: inserted.length, analyzed })
        .where(eq(ingestRuns.id, run.id));

    totals.fetched += issues.length;
    totals.inserted += inserted.length;
    totals.analyzed += analyzed;
  }
  return totals;
}
