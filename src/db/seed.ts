import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems, user } from "@/db/schema";

async function main() {
  if ((await db.select().from(feedbackItems).limit(1)).length > 0) return;

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
    sentiment: "positive",
    topics: ["Seed"],
    severityScore: 3,
    summary: "Seeded feedback item for testing.",
    status: "New",
  });
}

main().catch((err) => {
  process.stderr.write(`Seed failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
