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
 * Get enabled Slack webhook URLs for a user
 */
async function getUserSlackWebhooks(userId: string): Promise<string[]> {
  const hooks = await db
    .select({
      type: userNotifications.type,
      secretCipher: userNotifications.secretCipher,
    })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.enabled, true)));

  const urls: string[] = [];
  for (const hook of hooks || []) {
    if (hook.type === "slack" && hook.secretCipher) {
      try {
        const url = decrypt(hook.secretCipher as string);
        if (url) urls.push(url);
      } catch {
        // Ignore decryption errors
      }
    }
  }
  return urls;
}

/**
 * Send message to all user webhooks and global webhook
 */
async function notifyAllWebhooks(userId: string, message: string): Promise<void> {
  const webhooks = await getUserSlackWebhooks(userId);
  for (const url of webhooks) {
    await notifySlackTo(url, message);
  }
  // Fallback to global webhook if configured
  await notifySlack(message);
}

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
  await notifyAllWebhooks(userId, message);
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
  const summaryMsg = `Daily digest: ${analyses.length} analyses in last 24h. High severity: ${highSeverity.length}.`;

  // Get user webhooks and send digest
  const webhooks = await getUserSlackWebhooks(userId);
  for (const url of webhooks) {
    await notifySlackTo(url, summaryMsg);
    // Send top high-severity items
    for (const item of highSeverity.slice(0, 10)) {
      await notifySlackTo(url, `• [sev ${item.severityScore}] ${item.summary}`);
    }
  }

  return {
    total: analyses.length,
    high: highSeverity.length,
  };
}
