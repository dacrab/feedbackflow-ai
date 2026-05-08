import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications } from "@/db/schema";
import { HIGH_SEVERITY_THRESHOLD } from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import type { FeedbackAnalysis } from "@/lib/types";
import { notifySlack } from "@/lib/utils";

async function getUserSlackWebhooks(userId: string): Promise<string[]> {
  const hooks = await db
    .select({ secretCipher: userNotifications.secretCipher })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.enabled, true)));

  return hooks.flatMap((h) => {
    if (!h.secretCipher) return [];
    try { return [decrypt(h.secretCipher)]; } catch { return []; }
  });
}

export async function notifyHighSeverityFeedback(userId: string, analysis: FeedbackAnalysis): Promise<void> {
  if (analysis.severity_score < HIGH_SEVERITY_THRESHOLD) return;
  const message = `High severity (${analysis.severity_score}) feedback detected: ${analysis.summary}`;
  const webhooks = await getUserSlackWebhooks(userId);
  for (const url of webhooks) await notifySlack(message, url);
  await notifySlack(message);
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
  const summaryMsg = `Daily digest: ${analyses.length} analyses in last 24h. High severity: ${highSeverity.length}.`;

  const webhooks = await getUserSlackWebhooks(userId);
  for (const url of webhooks) {
    await notifySlack(summaryMsg, url);
    for (const item of highSeverity.slice(0, 10)) {
      await notifySlack(`• [sev ${item.severityScore}] ${item.summary}`, url);
    }
  }

  return { total: analyses.length, high: highSeverity.length };
}
