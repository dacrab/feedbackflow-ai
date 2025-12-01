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
import { fetchGithubIssues, type GithubIssue } from "@/lib/services/github-service";
import { requireAuth } from "@/lib/utils/api";
import { getDateNHoursAgo } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

type ProgressEvent = {
  stage: "fetching" | "analyzing" | "complete" | "error";
  message: string;
  current?: number;
  total?: number;
};

function sendEvent(controller: ReadableStreamDefaultController, event: ProgressEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
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

  if (!row?.ts) {
    return getDateNHoursAgo(24 * 30);
  }
  return row.ts instanceof Date ? row.ts.toISOString() : row.ts;
}

export async function GET() {
  let user: { id: string };
  try {
    user = await requireAuth();
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Get user's sources
        const sources = await db
          .select({
            id: userSources.id,
            type: userSources.type,
            config: userSources.config,
            secretCipher: userSources.secretCipher,
          })
          .from(userSources)
          .where(and(eq(userSources.userId, user.id), eq(userSources.enabled, true)));

        if (sources.length === 0) {
          sendEvent(controller, { stage: "error", message: "No sources configured" });
          controller.close();
          return;
        }

        let totalFetched = 0;
        let totalInserted = 0;
        let totalAnalyzed = 0;

        for (const source of sources) {
          const repo = (source.config as { repo?: string })?.repo;
          if (source.type !== "github" || !repo) {
            continue;
          }

          sendEvent(controller, { stage: "fetching", message: `Fetching issues from ${repo}...` });

          const token = source.secretCipher ? decrypt(source.secretCipher) : undefined;
          const sinceISO = await getLatestTimestamp(user.id);
          const issues = await fetchGithubIssues(repo, sinceISO, token);

          totalFetched += issues.length;
          sendEvent(controller, {
            stage: "fetching",
            message: `Fetched ${issues.length} issues from ${repo}`,
          });

          // Convert and filter new items
          const rows = issues.map((i: GithubIssue) => ({
            userId: user.id,
            source: "github" as const,
            externalId: String(i.id),
            rawContent: `${i.title}\n\n${i.body ?? ""}`.slice(0, 15000),
            originalTimestamp: new Date(i.created_at),
          }));

          const externalIds = rows.map((r) => r.externalId);
          const existing = await db
            .select({ externalId: feedbackItems.externalId })
            .from(feedbackItems)
            .where(
              and(
                eq(feedbackItems.userId, user.id),
                eq(feedbackItems.source, "github"),
                inArray(feedbackItems.externalId, externalIds),
              ),
            );

          const existingSet = new Set(existing.map((e) => e.externalId));
          const newItems = rows.filter((r) => !existingSet.has(r.externalId));

          // Insert new items
          let inserted: Array<{ id: string; rawContent: string }> = [];
          if (newItems.length > 0) {
            inserted = await db
              .insert(feedbackItems)
              .values(newItems)
              .returning({ id: feedbackItems.id, rawContent: feedbackItems.rawContent });
            totalInserted += inserted.length;
          }

          sendEvent(controller, {
            stage: "fetching",
            message: `Inserted ${inserted.length} new items`,
          });

          // Get unanalyzed items
          const unanalyzed = await db
            .select({ id: feedbackItems.id, rawContent: feedbackItems.rawContent })
            .from(feedbackItems)
            .leftJoin(feedbackAnalyses, eq(feedbackItems.id, feedbackAnalyses.feedbackItemId))
            .where(and(eq(feedbackItems.userId, user.id), isNull(feedbackAnalyses.id)))
            .limit(100);

          const toAnalyze = [...inserted, ...unanalyzed];

          if (toAnalyze.length === 0) {
            sendEvent(controller, { stage: "analyzing", message: "No items to analyze" });
            continue;
          }

          sendEvent(controller, {
            stage: "analyzing",
            message: `Analyzing ${toAnalyze.length} items...`,
            current: 0,
            total: toAnalyze.length,
          });

          const llmOpts = await getUserLLMOpts(user.id);

          for (let i = 0; i < toAnalyze.length; i++) {
            const item = toAnalyze[i];
            if (!item) {
              continue;
            }
            try {
              const analysis = await analyzeFeedback(item.rawContent, 2, llmOpts);

              await db
                .insert(feedbackAnalyses)
                .values({
                  userId: user.id,
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

              totalAnalyzed++;
              sendEvent(controller, {
                stage: "analyzing",
                message: `Analyzed: ${analysis.summary.slice(0, 50)}...`,
                current: i + 1,
                total: toAnalyze.length,
              });
            } catch {
              sendEvent(controller, {
                stage: "analyzing",
                message: `Failed to analyze item ${i + 1}`,
                current: i + 1,
                total: toAnalyze.length,
              });
            }
          }

          // Log the run
          await db.insert(ingestRuns).values({
            userId: user.id,
            fetched: totalFetched,
            inserted: totalInserted,
            analyzed: totalAnalyzed,
            ok: true,
            finishedAt: new Date(),
          });
        }

        sendEvent(controller, {
          stage: "complete",
          message: `Done! Fetched: ${totalFetched}, Inserted: ${totalInserted}, Analyzed: ${totalAnalyzed}`,
        });
      } catch (err) {
        sendEvent(controller, {
          stage: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
