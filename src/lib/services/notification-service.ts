import "server-only";

import * as Sentry from "@sentry/nextjs";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications } from "@/db/schema";
import { highSeverityAnalyses } from "@/db/views";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY, SLACK_TIMEOUT_MS } from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import type { FeedbackAnalysisData } from "@/lib/types";

async function notifySlack(text: string, url: string) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    if (!res.ok) {
      Sentry.captureMessage(`Slack notify failed: ${res.status}`, { level: "warning" });
    }
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
    } catch (e) {
      Sentry.captureException(e, { extra: { context: "get-webhooks-decrypt" } });
      return [];
    }
  });
}

export async function notifyHighSeverityFeedback(
  userId: string,
  analysis: FeedbackAnalysisData,
): Promise<void> {
  const webhooks = await getWebhooks(userId);
  const msg = `🚨 High severity (${analysis.severity_score}/${MAX_SEVERITY}): ${analysis.summary}`;
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
  const [rows, webhooks] = await Promise.all([
    db
      .select({
        summary: highSeverityAnalyses.summary,
        severityScore: highSeverityAnalyses.severityScore,
      })
      .from(highSeverityAnalyses)
      .where(
        and(
          eq(highSeverityAnalyses.userId, userId),
          gte(highSeverityAnalyses.createdAt, new Date(sinceISO)),
        ),
      )
      .orderBy(desc(highSeverityAnalyses.severityScore)),
    getWebhooks(userId),
  ]);

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackAnalyses)
    .where(
      and(eq(feedbackAnalyses.userId, userId), gte(feedbackAnalyses.createdAt, new Date(sinceISO))),
    )
    .then((r) => Number(r[0]?.count ?? 0));

  if (!rows.length || !webhooks.length) return { total, high: 0 };

  const lines = [
    `🔥 *Daily Digest* — ${total} items in last 24h, ${rows.length} high severity`,
    ...rows.map((a) => `• [sev ${a.severityScore}] ${a.summary}`),
  ];
  const msg = lines.join("\n");

  await Promise.all(webhooks.map(({ url }) => notifySlack(msg, url)));

  return { total, high: rows.length };
}
