import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const sentimentEnum = pgEnum("sentiment_type", ["positive", "neutral", "negative"]);
export const analysisStatusEnum = pgEnum("analysis_status", ["New", "Acknowledged", "Actioned"]);

// Users
export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("app_users_email_idx").on(t.email)],
);

// Feedback Items
export const feedbackItems = pgTable(
  "feedback_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    externalId: text("external_id").notNull(),
    rawContent: text("raw_content").notNull(),
    originalTimestamp: timestamp("original_timestamp", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [
    unique("feedback_items_user_source_external_idx").on(t.userId, t.source, t.externalId),
    index("feedback_items_user_id_idx").on(t.userId),
    index("feedback_items_created_at_idx").on(t.createdAt),
  ],
);

// Feedback Analyses
export const feedbackAnalyses = pgTable(
  "feedback_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    feedbackItemId: uuid("feedback_item_id")
      .notNull()
      .unique()
      .references(() => feedbackItems.id, { onDelete: "cascade" }),
    sentiment: sentimentEnum("sentiment").notNull(),
    topics: jsonb("topics").$type<Array<string>>().notNull(),
    severityScore: integer("severity_score").notNull(),
    summary: text("summary").notNull(),
    status: analysisStatusEnum("status").notNull().default("New"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [
    index("feedback_analyses_user_id_idx").on(t.userId),
    index("feedback_analyses_sentiment_idx").on(t.sentiment),
    index("feedback_analyses_severity_idx").on(t.severityScore),
  ],
);

// Analysis Topics (denormalized for querying)
export const analysisTopics = pgTable(
  "analysis_topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feedbackAnalysisId: uuid("feedback_analysis_id")
      .notNull()
      .references(() => feedbackAnalyses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("analysis_topics_user_topic_idx").on(t.userId, t.topic)],
);

// Ingest Runs
export const ingestRuns = pgTable(
  "ingest_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ok: boolean("ok"),
    error: text("error"),
    fetched: integer("fetched"),
    inserted: integer("inserted"),
    analyzed: integer("analyzed"),
  },
  (t) => [index("ingest_runs_user_id_idx").on(t.userId)],
);

// User Settings
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  apiKeyCipher: text("api_key_cipher"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// User Sources
export const userSources = pgTable(
  "user_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    secretCipher: text("secret_cipher"),
    enabled: boolean("enabled").default(true).notNull(),
    lastChecked: timestamp("last_checked", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("user_sources_user_id_idx").on(t.userId)],
);

// User Notifications
export const userNotifications = pgTable(
  "user_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    secretCipher: text("secret_cipher"),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("user_notifications_user_id_idx").on(t.userId)],
);

// Relations
export const appUsersRelations = relations(appUsers, ({ many, one }) => ({
  feedbackItems: many(feedbackItems),
  feedbackAnalyses: many(feedbackAnalyses),
  settings: one(userSettings),
  sources: many(userSources),
  notifications: many(userNotifications),
  ingestRuns: many(ingestRuns),
}));

export const feedbackItemsRelations = relations(feedbackItems, ({ one }) => ({
  user: one(appUsers, { fields: [feedbackItems.userId], references: [appUsers.id] }),
  analysis: one(feedbackAnalyses),
}));

export const feedbackAnalysesRelations = relations(feedbackAnalyses, ({ one, many }) => ({
  user: one(appUsers, { fields: [feedbackAnalyses.userId], references: [appUsers.id] }),
  feedbackItem: one(feedbackItems, {
    fields: [feedbackAnalyses.feedbackItemId],
    references: [feedbackItems.id],
  }),
  topics: many(analysisTopics),
}));
