import "server-only";

import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, userSettings } from "@/db/schema";
import { HIGH_SEVERITY_THRESHOLD } from "@/lib/constants";
import { tryDecrypt } from "@/lib/crypto";
import { analyzeFeedback, FATAL_LLM_ERROR, type LLMOptions, ThrottledError } from "@/lib/llm";
import { type Analysis, isLLMProvider } from "@/lib/types";

type OnProgress = (stage: string, message: string) => void;

// Each missing piece throws its own cause, so the user is told what to fix.
export async function getUserLLMOpts(userId: string): Promise<LLMOptions | undefined> {
  const [row] = await db
    .select({
      provider: userSettings.provider,
      model: userSettings.model,
      apiKeyCipher: userSettings.apiKeyCipher,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  if (!row) return undefined;
  if (!isLLMProvider(row.provider)) {
    throw new Error(`Unknown LLM provider "${row.provider}" — pick one again in Settings.`);
  }
  if (!row.model) throw new Error("No model selected. Pick a model in Settings.");
  const apiKey = tryDecrypt(row.apiKeyCipher, "llm-api-key-decrypt");
  if (!apiKey) throw new Error("No API key saved. Add one in Settings.");
  return { provider: row.provider, model: row.model, apiKey };
}

export interface AnalyzeResult {
  count: number;
  hasError: boolean;
  highSeverity: Analysis[];
}

interface ItemOutcome {
  analysis: Analysis | null;
  /** Fail every remaining item too, so stop the pass. */
  fatal: boolean;
}

/** Classify a provider failure. Our own limiter's message matches
 *  FATAL_LLM_ERROR, which would report a self-inflicted, 60s-retryable throttle
 *  as a permanent provider rejection. Provider text can also embed the prompt
 *  and raw response, so the client only ever gets an allow-listed reason. */
function classify(err: unknown, itemId: string, onProgress: OnProgress): boolean {
  Sentry.captureException(err, { extra: { context: "ingest-analyze", itemId } });
  const throttled = err instanceof ThrottledError;
  const fatal = !throttled && FATAL_LLM_ERROR.test(String(err));
  onProgress(
    "analysis_error",
    `failed: ${throttled ? "rate limit reached" : fatal ? "provider rejected the request" : "provider error"}`,
  );
  return fatal;
}

async function analyzeItem(
  item: { id: string; rawContent: string },
  userId: string,
  llmOpts: LLMOptions,
  onProgress: OnProgress,
  signal: AbortSignal | undefined,
): Promise<ItemOutcome> {
  try {
    const a = await analyzeFeedback({ text: item.rawContent, opts: llmOpts, userId, signal });
    const row = {
      sentiment: a.sentiment,
      topics: a.topics,
      severityScore: a.severity_score,
      summary: a.summary,
    };
    await db
      .insert(feedbackAnalyses)
      .values({ userId, feedbackItemId: item.id, ...row })
      .onConflictDoUpdate({ target: feedbackAnalyses.feedbackItemId, set: row });
    return { analysis: a, fatal: false };
  } catch (err) {
    return { analysis: null, fatal: classify(err, item.id, onProgress) };
  }
}

export async function analyzeAndStore(
  items: { id: string; rawContent: string }[],
  userId: string,
  llmOpts: LLMOptions | undefined,
  emit: OnProgress | undefined,
  signal: AbortSignal | undefined,
): Promise<AnalyzeResult> {
  const onProgress = emit ?? (() => {});

  // Bail out once rather than repeating the same failure for every item.
  if (!llmOpts) {
    onProgress("analysis_error", "LLM not configured. Add it in Settings.");
    return { count: 0, hasError: true, highSeverity: [] };
  }

  let count = 0;
  let hasError = false;
  const highSeverity: Analysis[] = [];

  for (const [i, item] of items.entries()) {
    if (signal?.aborted) break;
    onProgress("analyzing", `analyzing ${i + 1}/${items.length}...`);

    const { analysis, fatal } = await analyzeItem(item, userId, llmOpts, onProgress, signal);
    if (analysis) {
      count++;
      onProgress("analysis_ok", `analyzed ${count}/${items.length}`);
      if (analysis.severity_score >= HIGH_SEVERITY_THRESHOLD) highSeverity.push(analysis);
    }
    // An exhausted quota or a rejected key fails every remaining item too.
    if (fatal) {
      hasError = true;
      break;
    }
  }

  return { count, hasError, highSeverity };
}
