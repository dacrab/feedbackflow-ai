import { eq, sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
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
    // Target for the feedback_analyses composite FK below.
    unique("feedback_items_user_id_id_unique").on(t.userId, t.id),
    // OriginalTimestamp is what every time window buckets on; searching it
    // needs a trigram index because the filter is a leading-wildcard ILIKE.
    index("feedback_items_user_original_idx").on(t.userId, t.originalTimestamp),
  ],
);

export const feedbackAnalyses = pgTable(
  "feedback_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    feedbackItemId: uuid("feedback_item_id").notNull().unique(),
    sentiment: sentimentEnum("sentiment").notNull(),
    topics: jsonb("topics").$type<string[]>().notNull(),
    severityScore: integer("severity_score").notNull(),
    summary: text("summary").notNull(),
    status: analysisStatusEnum("status").notNull().default("New"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("feedback_analyses_user_created_idx").on(t.userId, t.createdAt),
    // The inbox filters on these two independently, so index them
    // independently: a 4-column index only helps when the leading two match.
    index("feedback_analyses_user_sentiment_idx").on(t.userId, t.sentiment),
    index("feedback_analyses_user_status_idx").on(t.userId, t.status),
    index("feedback_analyses_user_severity_idx").on(t.userId, t.severityScore),
    check("severity_score_range", sql`${t.severityScore} >= 1 AND ${t.severityScore} <= 5`),
    // Ownership is enforced against the parent item rather than assumed: the
    // inbox authorizes on feedback_items.user_id, the digest on this column,
    // so a drift between the two would be a cross-tenant read.
    foreignKey({
      name: "feedback_analyses_owner_fkey",
      columns: [t.userId, t.feedbackItemId],
      foreignColumns: [feedbackItems.userId, feedbackItems.id],
    }).onDelete("cascade"),
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
    error: text("error"),
    fetched: integer("fetched"),
    inserted: integer("inserted"),
    analyzed: integer("analyzed"),
  },
  (t) => [
    // Matches `WHERE user_id = ? ORDER BY started_at DESC LIMIT 1`; on
    // (user_id) alone Postgres must sort the user's whole run history.
    index("ingest_runs_user_started_idx").on(t.userId, t.startedAt),
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
  (t) => [
    index("user_sources_user_id_idx").on(t.userId),
    index("user_sources_enabled_idx").on(t.userId).where(sql`enabled`),
  ],
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
  (t) => [
    index("user_notifications_user_id_idx").on(t.userId),
    index("user_notifications_enabled_idx").on(t.userId).where(sql`enabled`),
  ],
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

// Analytics bucket on when the feedback was filed, not on when we scraped it:
// backfilling a repo with a year of issues must not render as a single spike.
export const feedbackTrend = pgView("feedback_trend").as((qb) =>
  qb
    .select({
      userId: feedbackItems.userId,
      day: sql<Date>`DATE(${feedbackItems.originalTimestamp})`.as("day"),
      cnt: sql<number>`COUNT(*)`.as("cnt"),
      delta:
        sql<number>`COUNT(*) - LAG(COUNT(*), 1, COUNT(*)) OVER (PARTITION BY ${feedbackItems.userId} ORDER BY DATE(${feedbackItems.originalTimestamp}))`.as(
          "delta",
        ),
    })
    .from(feedbackItems)
    .innerJoin(feedbackAnalyses, eq(feedbackAnalyses.feedbackItemId, feedbackItems.id))
    .groupBy(feedbackItems.userId, sql`DATE(${feedbackItems.originalTimestamp})`),
);

export const feedbackTopics = pgView("feedback_topics").as((qb) =>
  qb
    .select({
      userId: feedbackItems.userId,
      topic: sql<string>`t.topic`.as("topic"),
      // Newest filing date in the bucket, so the dashboard can window this the
      // same way as every other tile.
      day: sql<Date>`MAX(DATE(${feedbackItems.originalTimestamp}))`.as("day"),
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
