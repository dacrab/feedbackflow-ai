import { requireAuth } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try {
    const user = await requireAuth();
    userId = user.id;
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
  const sse = (stage: string, message: string) =>
    enc.encode(`data: ${JSON.stringify({ stage, message })}\n\n`);

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        ctrl.enqueue(sse("fetching", "fetching from sources..."));
        const { fetched, inserted, analyzed } = await runIngest();
        ctrl.enqueue(
          sse("complete", `done — ${fetched} fetched, ${inserted} new, ${analyzed} analyzed`),
        );
      } catch (err) {
        console.error("[Sync]", err);
        ctrl.enqueue(sse("error", "sync failed"));
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
