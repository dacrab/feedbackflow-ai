import { requireAuth } from "@/lib/api";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth();
  } catch (err) {
    return err instanceof Response
      ? err
      : new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const stream = new ReadableStream({
    async start(ctrl) {
      const encoder = new TextEncoder();
      const send = (stage: string, message: string) =>
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ stage, message })}\n\n`));

      try {
        send("fetching", "Starting ingest...");
        const { fetched, inserted, analyzed } = await runIngest();
        send("complete", `Done! Fetched: ${fetched}, Inserted: ${inserted}, Analyzed: ${analyzed}`);
      } catch (err) {
        send("error", err instanceof Error ? err.message : "Unknown error");
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
