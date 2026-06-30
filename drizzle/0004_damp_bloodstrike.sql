DROP TABLE "account" CASCADE;--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
DROP TABLE "verification" CASCADE;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "email_verified";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "user_notifications" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "user_sources" DROP COLUMN "updated_at";