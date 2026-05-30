CREATE INDEX "feedback_analyses_status_idx" ON "feedback_analyses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_analyses_user_created_idx" ON "feedback_analyses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "feedback_analyses_user_filter_idx" ON "feedback_analyses" USING btree ("user_id","sentiment","status","severity_score");--> statement-breakpoint
CREATE INDEX "feedback_items_user_source_ts_idx" ON "feedback_items" USING btree ("user_id","source","original_timestamp");