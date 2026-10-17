import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems, user } from "@/db/schema";

// The seed creates its own user; without one `db:seed` no-ops on a fresh
// database and verifies nothing.
const SEED_USER = { id: "seed-user", name: "Seed User", email: "seed@example.com" };
const SEED_EXTERNAL_ID = "seed-1";
const SEED_SOURCE = "seed";

async function main() {
  await db.insert(user).values(SEED_USER).onConflictDoNothing({ target: user.id });
  const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.id, SEED_USER.id));
  if (!owner) throw new Error("seed user was not created");

  const [existing] = await db
    .select({ id: feedbackItems.id })
    .from(feedbackItems)
    // Matches the (user_id, source, external_id) unique key, not just the id.
    .where(
      and(
        eq(feedbackItems.userId, owner.id),
        eq(feedbackItems.source, SEED_SOURCE),
        eq(feedbackItems.externalId, SEED_EXTERNAL_ID),
      ),
    )
    .limit(1);
  if (existing) {
    console.log("seed data already present");
    return;
  }

  const [item] = await db
    .insert(feedbackItems)
    .values({
      userId: owner.id,
      source: SEED_SOURCE,
      externalId: SEED_EXTERNAL_ID,
      rawContent: "This is a seeded feedback item to verify Neon + Drizzle wiring.",
      originalTimestamp: new Date(),
    })
    .returning({ id: feedbackItems.id });
  if (!item) throw new Error("failed to insert seed feedback item");

  await db.insert(feedbackAnalyses).values({
    userId: owner.id,
    feedbackItemId: item.id,
    sentiment: "positive",
    topics: ["Seed"],
    severityScore: 3,
    summary: "Seeded feedback item for testing.",
  });

  console.log(`seeded ${SEED_EXTERNAL_ID} for ${owner.id}`);
}

main().catch((err) => {
  console.error(`Seed failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
