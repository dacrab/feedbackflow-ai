import * as Sentry from "@sentry/nextjs";
import { jsonError, rateLimitResponse, requireAuth, UnauthorizedError } from "@/lib/api";
import { RATE_LIMITS, SYNC_FAILED_MESSAGE } from "@/lib/constants";
import { runIngest } from "@/lib/services/ingest-service";
import type { SyncStage } from "@/lib/types";

// Literal, not imported: Next's static extraction rejects identifiers. See
// /api/cron for the same value and the reason it cannot be shared.
export const maxDuration = 300;

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError("unauthorized", 401);
    throw err;
  }

  // The user id is already an unforgeable identity; adding IP would only let a
  // session holder mint a fresh bucket by rotating the header.
  const rl = await rateLimitResponse(`sync:${userId}`, RATE_LIMITS.sync);
  if (rl) return rl;

  const enc = new TextEncoder();
  const abortCtrl = new AbortController();
  req.signal.addEventListener("abort", () => abortCtrl.abort());

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (stage: SyncStage, message: string) => {
        try {
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ stage, message })}\n\n`));
        } catch {
          /* stream closed */
        }
      };

      try {
        send("fetching", "connecting...");
        const { fetched, inserted, analyzed } = await runIngest({
          onProgress: (stage, message) => send(stage, message),
          signal: abortCtrl.signal,
          userId,
        });
        if (!abortCtrl.signal.aborted) {
          send("complete", `done — ${fetched} fetched, ${inserted} new, ${analyzed} analyzed`);
        }
      } catch (err) {
        Sentry.captureException(err, { extra: { context: "api-sync" } });
        // Upstream/DB text can leak internals, and React strips it in production.
        send("error", SYNC_FAILED_MESSAGE);
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // X-Accel-Buffering: a buffering proxy would hold every event until
      // the stream closes.
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
