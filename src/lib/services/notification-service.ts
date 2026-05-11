import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications } from "@/db/schema";
import { HIGH_SEVERITY_THRESHOLD } from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import type { FeedbackAnalysisData } from "@/lib/types";

async function notifySlack(text: string, url?: string) {
  const webhook = url || process.env["SLACK_WEBHOOK_URL"];
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.error("[Slack]", e);
  }
}

async function getWebhooks(userId: string): Promise<string[]> {
  const rows = await db
    .select({ secretCipher: userNotifications.secretCipher })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.enabled, true)));
  return rows.flatMap((h) => {
    try {
      return h.secretCipher ? [decrypt(h.secretCipher)] : [];
    } catch {
      return [];
    }
  });
}

export async function notifyHighSeverityFeedback(
  userId: string,
  analysis: FeedbackAnalysisData,
): Promise<void> {
  if (analysis.severity_score < HIGH_SEVERITY_THRESHOLD) return;
  const msg = `High severity (${analysis.severity_score}) feedback detected: ${analysis.summary}`;
  for (const url of await getWebhooks(userId)) await notifySlack(msg, url);
  await notifySlack(msg);
}

export async function sendDailyDigest(
  userId: string,
  sinceISO: string,
): Promise<{ total: number; high: number }> {
  const [analyses, webhooks] = await Promise.all([
    db
      .select({ summary: feedbackAnalyses.summary, severityScore: feedbackAnalyses.severityScore })
      .from(feedbackAnalyses)
      .where(
        and(
          eq(feedbackAnalyses.userId, userId),
          gte(feedbackAnalyses.createdAt, new Date(sinceISO)),
        ),
      )
      .orderBy(desc(feedbackAnalyses.createdAt))
      .limit(500),
    getWebhooks(userId),
  ]);

  const high = analyses.filter((a) => a.severityScore >= HIGH_SEVERITY_THRESHOLD);
  const summary = `Daily digest: ${analyses.length} analyses in last 24h. High severity: ${high.length}.`;

  for (const url of webhooks) {
    await notifySlack(summary, url);
    for (const item of high.slice(0, 10))
      await notifySlack(`• [sev ${item.severityScore}] ${item.summary}`, url);
  }

  return { total: analyses.length, high: high.length };
}
