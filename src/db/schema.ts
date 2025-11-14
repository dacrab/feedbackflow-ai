import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Enums for sentiment and analysis status
export const sentimentEnum = pgEnum("sentiment_type", ["positive", "neutral", "negative"]);
export const analysisStatusEnum = pgEnum("analysis_status", ["New", "Acknowledged", "Actioned"]);

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const feedbackItems = pgTable("feedback_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  source: text("source").notNull(),
  externalId: text("external_id").notNull(),
  rawContent: text("raw_content").notNull(),
  originalTimestamp: timestamp("original_timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const feedbackAnalyses = pgTable("feedback_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  feedbackItemId: uuid("feedback_item_id").notNull(),
  sentiment: sentimentEnum("sentiment").notNull(),
  topics: jsonb("topics").$type<string[]>().notNull(),
  severityScore: integer("severity_score").notNull(),
  summary: text("summary").notNull(),
  status: analysisStatusEnum("status").notNull().default("New"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const analysisTopics = pgTable("analysis_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackAnalysisId: uuid("feedback_analysis_id").notNull(),
  userId: uuid("user_id").notNull(),
  topic: text("topic").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ingestRuns = pgTable("ingest_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ok: boolean("ok"),
  error: text("error"),
  fetched: integer("fetched"),
  inserted: integer("inserted"),
  analyzed: integer("analyzed"),
});

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  apiKeyCipher: text("api_key_cipher"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSources = pgTable("user_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  secretCipher: text("secret_cipher"),
  enabled: boolean("enabled").default(true).notNull(),
  lastChecked: timestamp("last_checked", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userNotifications = pgTable("user_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  secretCipher: text("secret_cipher"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
