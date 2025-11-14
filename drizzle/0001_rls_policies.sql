-- Enable row level security on user-scoped tables
ALTER TABLE "feedback_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "feedback_analyses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "analysis_topics" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ingest_runs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_sources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "app_users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Policies based on app.current_user_id GUC (must be set per request)
CREATE POLICY "feedback_items_owner" ON "feedback_items"
  USING ("user_id" = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK ("user_id" = current_setting('app.current_user_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "feedback_analyses_owner" ON "feedback_analyses"
  USING ("user_id" = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK ("user_id" = current_setting('app.current_user_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "analysis_topics_owner" ON "analysis_topics"
  USING ("user_id" = current_setting('app.current_user_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "ingest_runs_owner" ON "ingest_runs"
  USING ("user_id" = current_setting('app.current_user_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "user_settings_owner" ON "user_settings"
  USING ("user_id" = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK ("user_id" = current_setting('app.current_user_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "user_sources_owner" ON "user_sources"
  USING ("user_id" = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK ("user_id" = current_setting('app.current_user_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "user_notifications_owner" ON "user_notifications"
  USING ("user_id" = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK ("user_id" = current_setting('app.current_user_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "app_users_self" ON "app_users"
  USING ("id" = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK ("id" = current_setting('app.current_user_id', true)::uuid);


