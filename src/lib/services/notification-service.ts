/**
 * Consolidated notification service
 */

import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications } from "@/db/schema";
import { decrypt } from "@/lib/crypto";
import { notifySlack, notifySlackTo } from "@/lib/notify";
import type { FeedbackAnalysis } from "@/lib/types";

/**
 * Send high-severity notification for a user
 */
export async function notifyHighSeverityFeedback(
  userId: string,
  analysis: FeedbackAnalysis,
  severityThreshold: number = 4,
): Promise<void> {
  if (analysis.severity_score < severityThreshold) return;

  const message = `High severity (${analysis.severity_score}) feedback detected: ${analysis.summary}`;

  // Get user-specific Slack webhooks
  const hooks = await db
    .select({
      type: userNotifications.type,
      secretCipher: userNotifications.secretCipher,
      enabled: userNotifications.enabled,
    })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.enabled, true)));

  // Send to user-specific webhooks
  for (const hook of hooks || []) {
    if (hook.type === "slack" && hook.secretCipher) {
      try {
        const url = decrypt(hook.secretCipher as string);
        if (url) {
          await notifySlackTo(url, message);
        }
      } catch {
        // Ignore webhook errors
      }
    }
  }

  // Fallback to global webhook if configured
  await notifySlack(message);
}

/**
 * Send daily digest notification for a user
 */
export async function sendDailyDigest(
  userId: string,
  sinceISO: string,
): Promise<{
  total: number;
  high: number;
}> {
  // Get user's feedback analyses
  const analyses = await db
    .select({
      summary: feedbackAnalyses.summary,
      severityScore: feedbackAnalyses.severityScore,
      sentiment: feedbackAnalyses.sentiment,
      createdAt: feedbackAnalyses.createdAt,
    })
    .from(feedbackAnalyses)
    .where(
      and(eq(feedbackAnalyses.userId, userId), gte(feedbackAnalyses.createdAt, new Date(sinceISO))),
    )
    .orderBy(desc(feedbackAnalyses.createdAt));

  const highSeverity = analyses.filter((a) => a.severityScore >= 4);

  // Get user's notification webhooks
  const hooks = await db
    .select({
      type: userNotifications.type,
      secretCipher: userNotifications.secretCipher,
      enabled: userNotifications.enabled,
    })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.enabled, true)));

  const summary = `Daily digest: ${analyses.length} analyses in last 24h. High severity: ${highSeverity.length}.`;

  // Send to user-specific webhooks
  for (const hook of hooks || []) {
    if (hook.type === "slack" && hook.secretCipher) {
      try {
        const url = decrypt(hook.secretCipher as string);
        if (url) {
          await notifySlackTo(url, summary);
          // Send top high-severity items
          for (const item of highSeverity.slice(0, 10)) {
            await notifySlackTo(url, `• [sev ${item.severityScore}] ${item.summary}`);
          }
        }
      } catch {
        // Ignore webhook errors
      }
    }
  }

  return {
    total: analyses.length,
    high: highSeverity.length,
  };
}
