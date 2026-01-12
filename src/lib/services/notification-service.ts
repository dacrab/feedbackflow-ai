/**
 * Consolidated notification service
 */

import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications } from "@/db/schema";
import { HIGH_SEVERITY_THRESHOLD, HOURS_IN_DAY, MAX_DIGEST_ITEMS } from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import type { FeedbackAnalysis } from "@/lib/types";
import { notifySlack } from "@/lib/utils";

async function getUserSlackWebhooks(userId: string): Promise<Array<string>> {
  const hooks = await db
    .select({
      type: userNotifications.type,
      secretCipher: userNotifications.secretCipher,
    })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.enabled, true)));

  const urls: Array<string> = [];
  for (const hook of hooks || []) {
    if (hook.type === "slack" && hook.secretCipher) {
      try {
        const url = decrypt(hook.secretCipher as string);
        if (url) {
          urls.push(url);
        }
      } catch {
        // Ignore decryption errors
      }
    }
  }
  return urls;
}

async function notifyAllWebhooks(userId: string, message: string): Promise<void> {
  const webhooks = await getUserSlackWebhooks(userId);
  for (const url of webhooks) await notifySlack(message, url);
  await notifySlack(message);
}

export async function notifyHighSeverityFeedback(
  userId: string,
  analysis: FeedbackAnalysis,
): Promise<void> {
  if (analysis.severity_score < HIGH_SEVERITY_THRESHOLD) {
    return;
  }

  const message = `High severity (${analysis.severity_score}) feedback detected: ${analysis.summary}`;
  await notifyAllWebhooks(userId, message);
}

export async function sendDailyDigest(
  userId: string,
  sinceISO: string,
): Promise<{ total: number; high: number }> {
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

  const highSeverity = analyses.filter((a) => a.severityScore >= HIGH_SEVERITY_THRESHOLD);
  const summaryMsg = `Daily digest: ${analyses.length} analyses in last ${HOURS_IN_DAY}h. High severity: ${highSeverity.length}.`;

  const webhooks = await getUserSlackWebhooks(userId);
  for (const url of webhooks) {
    await notifySlack(summaryMsg, url);
    for (const item of highSeverity.slice(0, MAX_DIGEST_ITEMS)) {
      await notifySlack(`• [sev ${item.severityScore}] ${item.summary}`, url);
    }
  }

  return { total: analyses.length, high: highSeverity.length };
}
