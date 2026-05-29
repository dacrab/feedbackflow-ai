import { requireAuth } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { success } = rateLimit(`sync:${userId}`, { maxRequests: 5, windowMs: 60_000 });
  if (!success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

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
        const { fetched, inserted, analyzed } = await runIngest(
          (event) => send(event.stage, event.message),
          abortCtrl.signal,
        );
        if (!abortCtrl.signal.aborted) {
          send("complete", `done — ${fetched} fetched, ${inserted} new, ${analyzed} analyzed`);
        }
      } catch (err) {
        console.error("[Sync]", err);
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
