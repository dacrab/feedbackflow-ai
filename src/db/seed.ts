import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { analysisStatusEnum, feedbackAnalyses, feedbackItems, sentimentEnum } from "@/db/schema";

async function main() {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is required for seeding");
  }

  const sql = neon(url);
  const db = drizzle(sql);

  // Simple smoke-test seed: insert one feedback item + analysis if table is empty
  const existing = await db.select().from(feedbackItems).limit(1);
  if (existing.length > 0) {
    return;
  }

  const [item] = await db
    .insert(feedbackItems)
    .values({
      userId: "00000000-0000-0000-0000-000000000000",
      source: "seed",
      externalId: "seed-1",
      rawContent: "This is a seeded feedback item to verify Neon + Drizzle wiring.",
      originalTimestamp: new Date(),
    })
    .returning();

  if (!item) {
    throw new Error("Failed to insert seed feedback item");
  }

  await db.insert(feedbackAnalyses).values({
    userId: item.userId,
    feedbackItemId: item.id,
    sentiment: sentimentEnum.enumValues[0],
    topics: ["Seed"],
    severityScore: 3,
    summary: "Seeded feedback item for testing.",
    status: analysisStatusEnum.enumValues[0],
  });
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Seed failed: ${msg}\n`);
  process.exit(1);
});
