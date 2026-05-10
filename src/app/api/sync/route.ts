import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userSources } from "@/db/schema";
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
        const sources = await db
          .select({ config: userSources.config })
          .from(userSources)
          .where(eq(userSources.enabled, true));

        ctrl.enqueue(
          sse(
            "fetching",
            `fetching from ${sources.length} source${sources.length !== 1 ? "s" : ""}...`,
          ),
        );

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
