import { eq, sql } from "drizzle-orm";
import { pgView } from "drizzle-orm/pg-core";
import { feedbackAnalyses, feedbackItems } from "@/db/schema";

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
