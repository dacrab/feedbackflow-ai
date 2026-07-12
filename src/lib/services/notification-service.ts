import "server-only";

import * as Sentry from "@sentry/nextjs";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications } from "@/db/schema";
import { HIGH_SEVERITY_THRESHOLD } from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import type { FeedbackAnalysisData } from "@/lib/types";

async function notifySlack(text: string, url: string) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    Sentry.captureException(e, { extra: { context: "slack-notify" } });
  }
}

type WebhookEntry = { url: string; minSeverity: number };

async function getWebhooks(userId: string): Promise<WebhookEntry[]> {
  const rows = await db
    .select({
      secretCipher: userNotifications.secretCipher,
      config: userNotifications.config,
    })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.enabled, true)));

  return rows.flatMap((h) => {
    try {
      if (!h.secretCipher) return [];
      return [
        {
          url: decrypt(h.secretCipher),
          minSeverity: h.config.minSeverity ?? HIGH_SEVERITY_THRESHOLD,
        },
      ];
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
  const webhooks = await getWebhooks(userId);
  const msg = `🚨 High severity (${analysis.severity_score}/5): ${analysis.summary}`;
  const promises: Promise<void>[] = [];
  for (const { url, minSeverity } of webhooks) {
    if (analysis.severity_score >= minSeverity) promises.push(notifySlack(msg, url));
  }
  await Promise.all(promises);
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
      .orderBy(desc(feedbackAnalyses.severityScore)),
    getWebhooks(userId),
  ]);

  if (!analyses.length || !webhooks.length) return { total: analyses.length, high: 0 };

  const high = analyses.filter((a) => a.severityScore >= HIGH_SEVERITY_THRESHOLD);

  // Batch into a single Slack message instead of N individual posts
  const lines = [
    `📊 *Daily Digest* — ${analyses.length} items in last 24h, ${high.length} high severity`,
    ...high.slice(0, 10).map((a) => `• [sev ${a.severityScore}] ${a.summary}`),
  ];
  const msg = lines.join("\n");

  await Promise.all(webhooks.map(({ url }) => notifySlack(msg, url)));

  return { total: analyses.length, high: high.length };
}
