-- These three indexes already exist on databases that ran the hand-written
-- 0008 migration, where they were added directly to the SQL without a matching
-- snapshot. IF NOT EXISTS keeps this migration a no-op there while still
-- creating them on databases built purely from the snapshot history.
CREATE INDEX IF NOT EXISTS "feedback_analyses_topics_idx" ON "feedback_analyses" USING gin ("topics");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_items_raw_content_trgm_idx" ON "feedback_items" USING gin (lower("raw_content") gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_sources_user_repo_unique" ON "user_sources" USING btree ("user_id",("config" ->> 'repo')) WHERE "user_sources"."type" = 'github';--> statement-breakpoint
-- Dead since the first commit: nothing ever read it, and the row's identity is
-- the user_id primary key, so it carried no meaning.
ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "created_at";
