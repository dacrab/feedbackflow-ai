import { eq, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  pgView,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const sentimentEnum = pgEnum("sentiment_type", ["positive", "neutral", "negative"]);
export const analysisStatusEnum = pgEnum("analysis_status", ["New", "Acknowledged", "Actioned"]);
export const sourceTypeEnum = pgEnum("source_type", ["github"]);
export const notificationTypeEnum = pgEnum("notification_type", ["slack"]);

export type GitHubSourceConfig = {
  repo: string;
};

export type SlackNotificationConfig = {
  minSeverity?: number;
};

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedbackItems = pgTable(
  "feedback_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    externalId: text("external_id").notNull(),
    rawContent: text("raw_content").notNull(),
    originalTimestamp: timestamp("original_timestamp", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("feedback_items_user_source_external_idx").on(t.userId, t.source, t.externalId),
    index("feedback_items_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const feedbackAnalyses = pgTable(
  "feedback_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feedbackItemId: uuid("feedback_item_id")
      .notNull()
      .unique()
      .references(() => feedbackItems.id, { onDelete: "cascade" }),
    sentiment: sentimentEnum("sentiment").notNull(),
    topics: jsonb("topics").$type<string[]>().notNull(),
    severityScore: integer("severity_score").notNull(),
    summary: text("summary").notNull(),
    status: analysisStatusEnum("status").notNull().default("New"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("feedback_analyses_user_created_idx").on(t.userId, t.createdAt),
    index("feedback_analyses_user_filter_idx").on(t.userId, t.sentiment, t.status, t.severityScore),
    check("severity_score_range", sql`${t.severityScore} >= 1 AND ${t.severityScore} <= 5`),
  ],
);

export const ingestRuns = pgTable(
  "ingest_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ok: boolean("ok"),
    fetched: integer("fetched"),
    inserted: integer("inserted"),
    analyzed: integer("analyzed"),
  },
  (t) => [
    index("ingest_runs_user_id_idx").on(t.userId),
    uniqueIndex("ingest_runs_active_user_idx").on(t.userId).where(sql`${t.finishedAt} is null`),
  ],
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  apiKeyCipher: text("api_key_cipher"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSources = pgTable(
  "user_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: sourceTypeEnum("type").notNull(),
    config: jsonb("config").$type<GitHubSourceConfig>().notNull(),
    secretCipher: text("secret_cipher"),
    enabled: boolean("enabled").default(true).notNull(),
    lastChecked: timestamp("last_checked", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("user_sources_user_id_idx").on(t.userId)],
);

export const userNotifications = pgTable(
  "user_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    config: jsonb("config").$type<SlackNotificationConfig>().notNull(),
    secretCipher: text("secret_cipher"),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("user_notifications_user_id_idx").on(t.userId)],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    count: integer("count").notNull(),
  },
  (t) => [index("rate_limits_window_idx").on(t.windowStartedAt)],
);

export const feedbackTrend = pgView("feedback_trend").as((qb) =>
  qb
    .select({
      userId: feedbackItems.userId,
      day: sql<Date>`DATE(${feedbackItems.createdAt})`.as("day"),
      cnt: sql<number>`COUNT(*)`.as("cnt"),
      delta:
        sql<number>`COUNT(*) - LAG(COUNT(*), 1, COUNT(*)) OVER (PARTITION BY ${feedbackItems.userId} ORDER BY DATE(${feedbackItems.createdAt}))`.as(
          "delta",
        ),
    })
    .from(feedbackItems)
    .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .groupBy(feedbackItems.userId, sql`DATE(${feedbackItems.createdAt})`),
);

export const feedbackTopics = pgView("feedback_topics").as((qb) =>
  qb
    .select({
      userId: feedbackItems.userId,
      topic: sql<string>`t.topic`.as("topic"),
      cnt: sql<number>`COUNT(*)`.as("cnt"),
    })
    .from(feedbackItems)
    .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .innerJoin(
      sql`LATERAL jsonb_array_elements_text(${feedbackAnalyses.topics}) AS t(topic)`,
      sql`true`,
    )
    .groupBy(feedbackItems.userId, sql`t.topic`),
);

export const highSeverityAnalyses = pgView("high_severity_analyses").as((qb) =>
  qb
    .select({
      userId: feedbackAnalyses.userId,
      summary: feedbackAnalyses.summary,
      severityScore: feedbackAnalyses.severityScore,
      createdAt: feedbackAnalyses.createdAt,
    })
    .from(feedbackAnalyses)
    .where(sql`${feedbackAnalyses.severityScore} >= 4`),
);
