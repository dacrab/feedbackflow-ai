import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { analysisStatusEnum, feedbackAnalyses, feedbackItems, sentimentEnum, user } from "@/db/schema";

async function main() {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is required for seeding");

  const db = drizzle(neon(url));

  const existing = await db.select().from(feedbackItems).limit(1);
  if (existing.length > 0) return;

  const [existingUser] = await db.select({ id: user.id }).from(user).limit(1);
  if (!existingUser) {
    process.stdout.write("No users found - skipping seed (create a user first)\n");
    return;
  }

  const [item] = await db
    .insert(feedbackItems)
    .values({
      userId: existingUser.id,
      source: "seed",
      externalId: "seed-1",
      rawContent: "This is a seeded feedback item to verify Neon + Drizzle wiring.",
      originalTimestamp: new Date(),
    })
    .returning();

  if (!item) throw new Error("Failed to insert seed feedback item");

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
  process.stderr.write(`Seed failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
