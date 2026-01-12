-- Drop RLS policies that block column type changes
DROP POLICY IF EXISTS "feedback_analyses_owner" ON "feedback_analyses";
DROP POLICY IF EXISTS "feedback_items_owner" ON "feedback_items";
DROP POLICY IF EXISTS "ingest_runs_owner" ON "ingest_runs";
DROP POLICY IF EXISTS "user_notifications_owner" ON "user_notifications";
DROP POLICY IF EXISTS "user_settings_owner" ON "user_settings";
DROP POLICY IF EXISTS "user_sources_owner" ON "user_sources";
--> statement-breakpoint
-- Truncate app tables (dev branch - no real data)
TRUNCATE "feedback_analyses", "feedback_items", "ingest_runs", "user_notifications", "user_settings", "user_sources" CASCADE;
--> statement-breakpointCREATE TYPE "public"."notification_type" AS ENUM('slack');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('github');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_user_provider_idx" UNIQUE("user_id","provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_topics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "analysis_topics" CASCADE;--> statement-breakpoint
DROP TABLE "app_users" CASCADE;--> statement-breakpoint
ALTER TABLE "feedback_analyses" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "feedback_items" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ingest_runs" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_notifications" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_sources" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_sources" ALTER COLUMN "type" SET DATA TYPE "public"."source_type" USING "type"::"public"."source_type";--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "feedback_analyses" ADD CONSTRAINT "feedback_analyses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_analyses" ADD CONSTRAINT "feedback_analyses_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest_runs" ADD CONSTRAINT "ingest_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sources" ADD CONSTRAINT "user_sources_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_analyses_user_id_idx" ON "feedback_analyses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_analyses_sentiment_idx" ON "feedback_analyses" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "feedback_analyses_severity_idx" ON "feedback_analyses" USING btree ("severity_score");--> statement-breakpoint
CREATE INDEX "feedback_items_user_id_idx" ON "feedback_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_items_user_created_idx" ON "feedback_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ingest_runs_user_id_idx" ON "ingest_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_notifications_user_id_idx" ON "user_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sources_user_id_idx" ON "user_sources" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "feedback_analyses" ADD CONSTRAINT "feedback_analyses_feedback_item_id_unique" UNIQUE("feedback_item_id");--> statement-breakpoint
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_user_source_external_idx" UNIQUE("user_id","source","external_id");--> statement-breakpoint
ALTER TABLE "feedback_analyses" ADD CONSTRAINT "severity_score_range" CHECK ("feedback_analyses"."severity_score" >= 1 AND "feedback_analyses"."severity_score" <= 5);
