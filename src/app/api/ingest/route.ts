import { NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto";
import { analyzeFeedback } from "@/lib/llm";
import { notifySlack, notifySlackTo } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

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
  user_id: string;
  type: "github";
  config: { repo?: string } | null;
  secret_cipher: string | null;
  enabled: boolean;
};

async function getUserLLMOpts(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: settings } = await admin
    .from("user_settings")
    .select("provider, model, api_key_cipher")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!settings) return undefined;
  const apiKey = settings.api_key_cipher ? decrypt(settings.api_key_cipher as string) : undefined;
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

    const admin = createAdminClient();

    // Fetch enabled user sources; if none, fallback to legacy env-based single source
    const { data: sources, error: srcErr } = await admin
      .from("user_sources")
      .select("id, user_id, type, config, secret_cipher, enabled")
      .eq("enabled", true);
    if (srcErr) throw srcErr;

    const perUserSettings = new Map<string, ReturnType<typeof getUserLLMOpts>>();

    let totalFetched = 0;
    let totalInserted = 0;
    let totalAnalyzed = 0;

    if (sources && sources.length > 0) {
      for (const src of sources as unknown as UserSource[]) {
        if (src.type !== "github") continue;
        const repo = src.config?.repo;
        if (!repo) continue;
        const ghToken = src.secret_cipher ? decrypt(src.secret_cipher) : undefined;

        // compute since from latest per user/source
        const { data: latestRow } = await admin
          .from("feedback_items")
          .select("original_timestamp")
          .eq("user_id", src.user_id)
          .eq("source", "github")
          .order("original_timestamp", { ascending: false })
          .limit(1)
          .maybeSingle();
        const sinceISO =
          latestRow?.original_timestamp ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const issues = await fetchIssues(repo, sinceISO, ghToken);
        totalFetched += issues.length;
        const rows = issues.map((i) => ({
          user_id: src.user_id,
          source: "github" as const,
          external_id: String(i.id),
          raw_content: `${i.title}\n\n${i.body ?? ""}`.slice(0, 15000),
          original_timestamp: i.created_at,
        }));

        const externalIds = rows.map((r) => r.external_id);
        const { data: existing } = await admin
          .from("feedback_items")
          .select("external_id")
          .eq("user_id", src.user_id)
          .eq("source", "github")
          .in("external_id", externalIds);
        const existingSet = new Set(
          ((existing || []) as { external_id: string }[]).map((e) => e.external_id),
        );
        const toInsert = rows.filter((r) => !existingSet.has(r.external_id));

        let inserted: { id: string; raw_content: string }[] = [];
        if (toInsert.length > 0) {
          const { data: ins } = await admin
            .from("feedback_items")
            .insert(toInsert)
            .select("id, raw_content");
          inserted = (ins || []) as { id: string; raw_content: string }[];
        }
        totalInserted += inserted.length;

        // start per-user ingest run
        const { data: runStart } = await admin
          .from("ingest_runs")
          .insert({ user_id: src.user_id, fetched: issues.length })
          .select("id")
          .single();
        const runId = runStart?.id as string | undefined;

        // Resolve user-specific LLM options
        let optsPromise = perUserSettings.get(src.user_id);
        if (!optsPromise) {
          optsPromise = getUserLLMOpts(admin, src.user_id);
          perUserSettings.set(src.user_id, optsPromise);
        }
        const opts = await optsPromise;

        let analyzed = 0;
        if (inserted && inserted.length > 0) {
          for (const item of inserted) {
            try {
              const analysis = await analyzeFeedback(item.raw_content, 2, opts);
              const { error: aErr } = await admin.from("feedback_analyses").upsert(
                {
                  user_id: src.user_id,
                  feedback_item_id: item.id,
                  sentiment: analysis.sentiment,
                  topics: analysis.topics,
                  severity_score: analysis.severity_score,
                  summary: analysis.summary,
                },
                { onConflict: "feedback_item_id" },
              );
              if (!aErr) analyzed++;
              if (analysis.severity_score >= 4) {
                // Per-user notifications (Slack) if configured
                const { data: hooks } = await admin
                  .from("user_notifications")
                  .select("type, secret_cipher, enabled")
                  .eq("user_id", src.user_id)
                  .eq("enabled", true);
                for (const h of hooks || []) {
                  if (h.type === "slack" && h.secret_cipher) {
                    const url = decrypt(h.secret_cipher as string);
                    await notifySlackTo(
                      url,
                      `High severity (${analysis.severity_score}) feedback detected: ${analysis.summary}`,
                    );
                  }
                }
                // Fallback to global webhook if any
                await notifySlack(
                  `High severity (${analysis.severity_score}) feedback detected: ${analysis.summary}`,
                );
              }
            } catch (_e) {
              // skip on error
            }
          }
        }
        totalAnalyzed += analyzed;

        if (runId) {
          await admin
            .from("ingest_runs")
            .update({
              ok: true,
              finished_at: new Date().toISOString(),
              inserted: inserted?.length ?? 0,
              analyzed,
            })
            .eq("id", runId);
        }
      }
    } else {
      // Legacy fallback: use single env-configured repository
      const repo = process.env["INGEST_REPO"];
      if (!repo) {
        return NextResponse.json(
          { error: "No user sources configured and INGEST_REPO missing" },
          { status: 400 },
        );
      }
      const ghToken = process.env["GITHUB_TOKEN"];
      const { data: latestRow } = await admin
        .from("feedback_items")
        .select("original_timestamp")
        .eq("source", "github")
        .order("original_timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();
      const sinceISO =
        latestRow?.original_timestamp ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const issues = await fetchIssues(repo, sinceISO, ghToken ?? undefined);
      totalFetched += issues.length;
      const rows = issues.map((i) => ({
        source: "github" as const,
        external_id: String(i.id),
        raw_content: `${i.title}\n\n${i.body ?? ""}`.slice(0, 15000),
        original_timestamp: i.created_at,
      }));
      const externalIds = rows.map((r) => r.external_id);
      const { data: existing } = await admin
        .from("feedback_items")
        .select("external_id")
        .eq("source", "github")
        .in("external_id", externalIds);
      const existingSet = new Set(
        ((existing || []) as { external_id: string }[]).map((e) => e.external_id),
      );
      const toInsert = rows.filter((r) => !existingSet.has(r.external_id));
      const { data: ins } = await admin
        .from("feedback_items")
        .insert(toInsert)
        .select("id, raw_content");
      const inserted = (ins || []) as { id: string; raw_content: string }[];
      totalInserted += inserted.length;
      let analyzed = 0;
      for (const item of inserted) {
        try {
          const analysis = await analyzeFeedback(item.raw_content, 2, undefined);
          const { error: aErr } = await admin.from("feedback_analyses").upsert(
            {
              feedback_item_id: item.id,
              sentiment: analysis.sentiment,
              topics: analysis.topics,
              severity_score: analysis.severity_score,
              summary: analysis.summary,
            },
            { onConflict: "feedback_item_id" },
          );
          if (!aErr) analyzed++;
          if (analysis.severity_score >= 4) {
            await notifySlack(
              `High severity (${analysis.severity_score}) feedback detected: ${analysis.summary}`,
            );
          }
        } catch {}
      }
      totalAnalyzed += analyzed;
      await admin.from("ingest_runs").insert({
        fetched: issues.length,
        inserted: inserted.length,
        analyzed,
        ok: true,
      });
    }

    return NextResponse.json({
      fetched: totalFetched,
      inserted: totalInserted,
      analyzed: totalAnalyzed,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    try {
      const admin = createAdminClient();
      await admin.from("ingest_runs").insert({ ok: false, error: msg });
    } catch {}
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // allow invoking via GET for manual testing
  return POST(req);
}
