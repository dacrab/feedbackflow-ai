import { requireAuth } from "@/lib/api";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const enc = new TextEncoder();
  const sse = (stage: string, message: string) =>
    enc.encode(`data: ${JSON.stringify({ stage, message })}\n\n`);

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        ctrl.enqueue(sse("fetching", "Starting ingest..."));
        const { fetched, inserted, analyzed } = await runIngest();
        ctrl.enqueue(
          sse(
            "complete",
            `Done! Fetched: ${fetched}, Inserted: ${inserted}, Analyzed: ${analyzed}`,
          ),
        );
      } catch (err) {
        ctrl.enqueue(sse("error", err instanceof Error ? err.message : "Unknown error"));
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
