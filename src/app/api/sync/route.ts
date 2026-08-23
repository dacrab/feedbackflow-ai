import * as Sentry from "@sentry/nextjs";
import { rateLimitMiddleware, requireAuth } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/constants";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const rl = await rateLimitMiddleware(req, `sync:${userId}`, RATE_LIMITS.sync);
  if (rl) return rl;

  const enc = new TextEncoder();
  const abortCtrl = new AbortController();

  req.signal.addEventListener("abort", () => abortCtrl.abort());

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (stage: string, message: string) => {
        try {
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ stage, message })}\n\n`));
        } catch {
          /* stream closed */
        }
      };

      try {
        send("fetching", "connecting...");
        const { fetched, inserted, analyzed } = await runIngest({
          onProgress: (event) => send(event.stage, event.message),
          signal: abortCtrl.signal,
          userId,
        });
        if (!abortCtrl.signal.aborted) {
          send("complete", `done — ${fetched} fetched, ${inserted} new, ${analyzed} analyzed`);
        }
      } catch (err) {
        Sentry.captureException(err, { extra: { context: "api-sync" } });
        send("error", err instanceof Error ? err.message : "sync failed");
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
