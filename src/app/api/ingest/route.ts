import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
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

type GithubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  pull_request?: Record<string, unknown>;
  html_url: string;
};

async function fetchIssues(repo: string, sinceISO: string, token?: string) {
  const out: GithubIssue[] = [];
  const maxPages = 3;
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.github.com/repos/${repo}/issues?state=all&since=${encodeURIComponent(
      sinceISO,
    )}&per_page=50&page=${page}&sort=updated&direction=desc`;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "feedbackflow-ai",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: "application/vnd.github+json",
          },
          next: { revalidate: 0 },
        });
        if (!res.ok) {
          throw new Error(`GitHub fetch failed: ${res.status} ${await res.text()}`);
        }
        const batch = (await res.json()) as GithubIssue[];
        if (!Array.isArray(batch) || batch.length === 0) {
          attempt = 99; // break out
          break;
        }
        out.push(...batch.filter((i) => !("pull_request" in i)).map((i) => ({ ...i })));
        break; // success for this page
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    // If still failing after retries, throw
    if (out.length === 0 && page === 1 && lastErr) throw lastErr;
  }
  return out;
}

type UserSource = {
  id: string;
  userId: string;
  type: "github";
  config: { repo?: string } | null;
  secretCipher: string | null;
  enabled: boolean;
};

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

  if (!settings) return undefined;
  const apiKey = settings.apiKeyCipher ? decrypt(settings.apiKeyCipher) : undefined;
  const base = {
    provider: settings.provider as "google" | "openai" | "anthropic",
    model: settings.model as string,
  } as const;
  return apiKey ? { ...base, apiKey } : base;
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("x-cron-token");
    if (token !== process.env["CRON_TOKEN"]) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Fetch enabled user sources
    const sources = await db
      .select({
        id: userSources.id,
        userId: userSources.userId,
        type: userSources.type,
        config: userSources.config,
        secretCipher: userSources.secretCipher,
        enabled: userSources.enabled,
      })
      .from(userSources)
      .where(eq(userSources.enabled, true));

    const perUserSettings = new Map<string, ReturnType<typeof getUserLLMOpts>>();

    let totalFetched = 0;
    let totalInserted = 0;
    let totalAnalyzed = 0;

    if (sources && sources.length > 0) {
      for (const src of sources as UserSource[]) {
        if (src.type !== "github") continue;
        const repo = src.config?.repo;
        if (!repo) continue;
        const ghToken = src.secretCipher ? decrypt(src.secretCipher) : undefined;

        // compute since from latest per user/source
        const [latestRow] = await db
          .select({ originalTimestamp: feedbackItems.originalTimestamp })
          .from(feedbackItems)
          .where(and(eq(feedbackItems.userId, src.userId), eq(feedbackItems.source, "github")))
          .orderBy(desc(feedbackItems.originalTimestamp))
          .limit(1);

        const sinceISO =
          (latestRow?.originalTimestamp instanceof Date
            ? latestRow.originalTimestamp.toISOString()
            : latestRow?.originalTimestamp) ?? getDateNHoursAgo(24);

        const issues = await fetchIssues(repo, sinceISO, ghToken);
        totalFetched += issues.length;
        const rows = issues.map((i) => ({
          userId: src.userId,
          source: "github" as const,
          externalId: String(i.id),
          rawContent: `${i.title}\n\n${i.body ?? ""}`.slice(0, 15000),
          originalTimestamp: new Date(i.created_at),
        }));

        const externalIds = rows.map((r) => r.externalId);
        const existing = externalIds.length
          ? await db
              .select({ externalId: feedbackItems.externalId })
              .from(feedbackItems)
              .where(
                and(
                  eq(feedbackItems.userId, src.userId),
                  eq(feedbackItems.source, "github"),
                  inArray(feedbackItems.externalId, externalIds),
                ),
              )
          : [];

        const existingSet = new Set(existing.map((e) => e.externalId));
        const toInsert = rows.filter((r) => !existingSet.has(r.externalId));

        let inserted: { id: string; rawContent: string }[] = [];
        if (toInsert.length > 0) {
          inserted = await db
            .insert(feedbackItems)
            .values(toInsert)
            .returning({ id: feedbackItems.id, rawContent: feedbackItems.rawContent });
        }
        totalInserted += inserted.length;

        // start per-user ingest run
        const [runStart] = await db
          .insert(ingestRuns)
          .values({ userId: src.userId, fetched: issues.length })
          .returning({ id: ingestRuns.id });
        const runId = runStart?.id as string | undefined;

        // Resolve user-specific LLM options
        let optsPromise = perUserSettings.get(src.userId);
        if (!optsPromise) {
          optsPromise = getUserLLMOpts(src.userId);
          perUserSettings.set(src.userId, optsPromise);
        }
        const opts = await optsPromise;

        let analyzed = 0;
        if (inserted && inserted.length > 0) {
          for (const item of inserted) {
            try {
              const analysis = await analyzeFeedback(item.rawContent, 2, opts);

              await db
                .insert(feedbackAnalyses)
                .values({
                  userId: src.userId,
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

              analyzed++;
              if (analysis.severity_score >= 4) {
                await notifyHighSeverityFeedback(src.userId, {
                  ...analysis,
                  status: "New",
                });
              }
            } catch (_e) {
              // skip on error
            }
          }
        }
        totalAnalyzed += analyzed;

        if (runId) {
          await db
            .update(ingestRuns)
            .set({
              ok: true,
              finishedAt: new Date(),
              inserted: inserted?.length ?? 0,
              analyzed,
            })
            .where(eq(ingestRuns.id, runId));
        }
      }
    }

    return NextResponse.json({
      fetched: totalFetched,
      inserted: totalInserted,
      analyzed: totalAnalyzed,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // allow invoking via GET for manual testing
  return POST(req);
}
