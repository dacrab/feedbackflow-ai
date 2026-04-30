import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackItems, ingestRuns, userSources } from "@/db/schema";
import { requireAuth } from "@/lib/api";
import { MAX_RAW_CONTENT_LENGTH } from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import { fetchGithubIssues } from "@/lib/services/github-service";
import {
  analyzeAndStore,
  getLatestTimestamp,
  getUnanalyzedItems,
  getUserLLMOpts,
} from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";

type Event = {
  stage: "fetching" | "analyzing" | "complete" | "error";
  message: string;
  current?: number;
  total?: number;
};
const send = (ctrl: ReadableStreamDefaultController, e: Event) =>
  ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(e)}\n\n`));

export async function GET() {
  let user: { id: string };
  try {
    user = await requireAuth();
  } catch (err) {
    return err instanceof Response
      ? err
      : new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        const sources = await db
          .select({
            id: userSources.id,
            type: userSources.type,
            config: userSources.config,
            secretCipher: userSources.secretCipher,
          })
          .from(userSources)
          .where(and(eq(userSources.userId, user.id), eq(userSources.enabled, true)));

        if (!sources.length) {
          send(ctrl, { stage: "error", message: "No sources configured" });
          return ctrl.close();
        }

        let fetched = 0,
          inserted = 0,
          analyzed = 0;

        for (const src of sources) {
          const repo = (src.config as { repo?: string })?.repo;
          if (src.type !== "github" || !repo) continue;

          send(ctrl, { stage: "fetching", message: `Fetching from ${repo}...` });
          const token = src.secretCipher ? decrypt(src.secretCipher) : undefined;
          const issues = await fetchGithubIssues(repo, await getLatestTimestamp(user.id), token);
          fetched += issues.length;

          // Transform issues to rows
          const rows = issues.map((i) => ({
            userId: user.id,
            source: "github" as const,
            externalId: String(i.id),
            rawContent: `${i.title}\n\n${i.body ?? ""}`.slice(0, MAX_RAW_CONTENT_LENGTH),
            originalTimestamp: new Date(i.created_at),
          }));

          // Filter out existing items
          const newItems = rows.length
            ? await (async () => {
                const existing = await db
                  .select({ externalId: feedbackItems.externalId })
                  .from(feedbackItems)
                  .where(
                    and(
                      eq(feedbackItems.userId, user.id),
                      eq(feedbackItems.source, "github"),
                      inArray(
                        feedbackItems.externalId,
                        rows.map((r) => r.externalId),
                      ),
                    ),
                  );
                const set = new Set(existing.map((e) => e.externalId));
                return rows.filter((r) => !set.has(r.externalId));
              })()
            : [];

          // Insert new items
          const ins = newItems.length
            ? await db
                .insert(feedbackItems)
                .values(newItems)
                .returning({ id: feedbackItems.id, rawContent: feedbackItems.rawContent })
            : [];
          inserted += ins.length;
          send(ctrl, {
            stage: "fetching",
            message: `Fetched ${issues.length}, inserted ${ins.length}`,
          });

          const toAnalyze = [...ins, ...(await getUnanalyzedItems(user.id, 100))];
          if (!toAnalyze.length) {
            send(ctrl, { stage: "analyzing", message: "Nothing to analyze" });
            continue;
          }

          send(ctrl, {
            stage: "analyzing",
            message: `Analyzing ${toAnalyze.length}...`,
            current: 0,
            total: toAnalyze.length,
          });
          const count = await analyzeAndStore(
            toAnalyze,
            user.id,
            await getUserLLMOpts(user.id),
            (cur, tot, sum) => {
              send(ctrl, {
                stage: "analyzing",
                message: sum.startsWith("Failed") ? sum : `${sum.slice(0, 50)}...`,
                current: cur,
                total: tot,
              });
            },
          );
          analyzed += count;

          await db.insert(ingestRuns).values({
            userId: user.id,
            fetched,
            inserted,
            analyzed,
            ok: true,
            finishedAt: new Date(),
          });
        }

        send(ctrl, {
          stage: "complete",
          message: `Done! Fetched: ${fetched}, Inserted: ${inserted}, Analyzed: ${analyzed}`,
        });
      } catch (err) {
        send(ctrl, {
          stage: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        ctrl.close();
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
