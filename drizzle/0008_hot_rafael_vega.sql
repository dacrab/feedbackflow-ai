-- Views first: they are rebuilt at the end against the new columns.
DROP VIEW IF EXISTS "public"."high_severity_analyses";--> statement-breakpoint
DROP VIEW IF EXISTS "public"."feedback_topics";--> statement-breakpoint
DROP VIEW IF EXISTS "public"."feedback_trend";--> statement-breakpoint

-- Repair any row whose copied user_id drifted from the owning item, before the
-- constraint below makes that impossible.
UPDATE "feedback_analyses" fa
SET "user_id" = fi."user_id"
FROM "feedback_items" fi
WHERE fa."feedback_item_id" = fi."id" AND fa."user_id" <> fi."user_id";--> statement-breakpoint

-- Collapse repos added twice before the constraint makes that impossible.
DELETE FROM "user_sources" a USING "user_sources" b
WHERE a."user_id" = b."user_id"
  AND a."config" ->> 'repo' = b."config" ->> 'repo'
  AND a."type" = 'github'
  AND a."id" > b."id";--> statement-breakpoint

ALTER TABLE "feedback_analyses" DROP CONSTRAINT "feedback_analyses_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "feedback_analyses" DROP CONSTRAINT "feedback_analyses_feedback_item_id_feedback_items_id_fk";--> statement-breakpoint

-- Target of the composite FK, so it must exist before the FK that uses it.
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_user_id_id_unique" UNIQUE("user_id","id");--> statement-breakpoint
ALTER TABLE "feedback_analyses" ADD CONSTRAINT "feedback_analyses_owner_fkey" FOREIGN KEY ("user_id","feedback_item_id") REFERENCES "public"."feedback_items"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "ingest_runs" ADD COLUMN "error" text;--> statement-breakpoint

-- Replaces feedback_analyses_user_filter_idx: a 4-column index only helped when
-- its leading two columns matched, and no query matched both.
DROP INDEX IF EXISTS "feedback_analyses_user_filter_idx";--> statement-breakpoint
CREATE INDEX "feedback_analyses_user_sentiment_idx" ON "feedback_analyses" USING btree ("user_id","sentiment");--> statement-breakpoint
CREATE INDEX "feedback_analyses_user_status_idx" ON "feedback_analyses" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "feedback_analyses_user_severity_idx" ON "feedback_analyses" USING btree ("user_id","severity_score");--> statement-breakpoint
CREATE INDEX "feedback_items_user_original_idx" ON "feedback_items" USING btree ("user_id","original_timestamp");--> statement-breakpoint

-- Matches WHERE user_id = ? ORDER BY started_at DESC LIMIT 1.
DROP INDEX IF EXISTS "ingest_runs_user_id_idx";--> statement-breakpoint
CREATE INDEX "ingest_runs_user_started_idx" ON "ingest_runs" USING btree ("user_id","started_at");--> statement-breakpoint

-- The cron's entry-point queries filter on enabled across every tenant.
CREATE INDEX "user_sources_enabled_idx" ON "user_sources" USING btree ("user_id") WHERE enabled;--> statement-breakpoint
CREATE INDEX "user_notifications_enabled_idx" ON "user_notifications" USING btree ("user_id") WHERE enabled;--> statement-breakpoint

-- Makes the inbox search box an index scan instead of a seq scan: the filter is
-- a leading-wildcard lower() LIKE, which no btree can serve.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "feedback_items_raw_content_trgm_idx" ON "feedback_items" USING gin (lower("raw_content") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "feedback_analyses_topics_idx" ON "feedback_analyses" USING gin ("topics");--> statement-breakpoint

-- Turns addSource's duplicate check from a race into a constraint violation.
CREATE UNIQUE INDEX "user_sources_user_repo_unique" ON "user_sources" ("user_id", ("config" ->> 'repo')) WHERE "type" = 'github';--> statement-breakpoint

CREATE VIEW "public"."feedback_trend" AS (select "feedback_items"."user_id", DATE("feedback_items"."original_timestamp") as "day", COUNT(*) as "cnt", COUNT(*) - LAG(COUNT(*), 1, COUNT(*)) OVER (PARTITION BY "feedback_items"."user_id" ORDER BY DATE("feedback_items"."original_timestamp")) as "delta" from "feedback_items" inner join "feedback_analyses" on "feedback_analyses"."feedback_item_id" = "feedback_items"."id" group by "feedback_items"."user_id", DATE("feedback_items"."original_timestamp"));--> statement-breakpoint
CREATE VIEW "public"."feedback_topics" AS (select "feedback_items"."user_id", t.topic as "topic", MAX(DATE("feedback_items"."original_timestamp")) as "day", COUNT(*) as "cnt" from "feedback_items" inner join "feedback_analyses" on "feedback_analyses"."feedback_item_id" = "feedback_items"."id" inner join LATERAL jsonb_array_elements_text("feedback_analyses"."topics") AS t(topic) on true group by "feedback_items"."user_id", t.topic);
