import "server-only";

import * as Sentry from "@sentry/nextjs";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications } from "@/db/schema";
import { DIGEST_WINDOW_HOURS, HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import { tryDecrypt } from "@/lib/crypto";
import type { Analysis } from "@/lib/types";

interface WebhookEntry {
  url: string;
  minSeverity: number;
}

// Slack mrkdwn treats & < > as control characters, so issue text (public,
// attacker-authored) could inject @mentions or links without this.
function slackEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// One digest is a summary; more rows than anyone reads just bloat the payload.
const DIGEST_MAX_ROWS = 20;

// Slack rejects payloads over ~4000 characters; stay well under that.
const SLACK_MAX_TEXT = 3500;
// A stalled webhook would otherwise hold the cron request open past its budget.
const SLACK_TIMEOUT_MS = 10_000;

async function notifySlack(text: string, url: string) {
  try {
    const res = await fetch(url, {
      method: "POST",
      // url is user-supplied: a redirect would walk us into the private
      // network, or downgrade to http.
      redirect: "manual",
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

async function getWebhooks(userId: string): Promise<WebhookEntry[]> {
  const rows = await db
    .select({
      secretCipher: userNotifications.secretCipher,
      config: userNotifications.config,
    })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.enabled, true)));

  return rows.flatMap((h) => {
    const url = tryDecrypt(h.secretCipher, "get-webhooks-decrypt");
    return url ? [{ url, minSeverity: h.config.minSeverity ?? HIGH_SEVERITY_THRESHOLD }] : [];
  });
}

// One webhook query + decrypt for the whole batch, not one per item.
export async function notifyHighSeverityFeedback(
  userId: string,
  analyses: readonly Analysis[],
): Promise<void> {
  if (analyses.length === 0) return;
  const webhooks = await getWebhooks(userId);
  if (webhooks.length === 0) return;

  await Promise.all(
    analyses.flatMap((a) => {
      const msg = `🚨 High severity (${a.severity_score}/${MAX_SEVERITY}): ${slackEscape(a.summary)}`;
      return webhooks
        .filter((w) => a.severity_score >= w.minSeverity)
        .map((w) => notifySlack(msg, w.url));
    }),
  );
}

export async function sendDailyDigest(
  userId: string,
  since: Date,
): Promise<{ total: number; high: number }> {
  const [topRows, webhooks, [countRow]] = await Promise.all([
    db
      .select({
        summary: feedbackAnalyses.summary,
        severityScore: feedbackAnalyses.severityScore,
      })
      .from(feedbackAnalyses)
      .where(
        and(
          eq(feedbackAnalyses.userId, userId),
          gte(feedbackAnalyses.severityScore, HIGH_SEVERITY_THRESHOLD),
          gte(feedbackAnalyses.createdAt, since),
        ),
      )
      .orderBy(desc(feedbackAnalyses.severityScore))
      .limit(DIGEST_MAX_ROWS),
    getWebhooks(userId),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedbackAnalyses)
      .where(and(eq(feedbackAnalyses.userId, userId), gte(feedbackAnalyses.createdAt, since))),
  ]);

  const total = countRow?.count ?? 0;

  // Nothing to notify about, but the caller still counts what was in window.
  if (topRows.length === 0 || webhooks.length === 0) return { total, high: 0 };

  const body = [
    `🔥 *Daily Digest* — ${total} items in last ${DIGEST_WINDOW_HOURS}h, top ${topRows.length} high severity`,
    ...topRows.map((a) => `• [sev ${a.severityScore}] ${slackEscape(a.summary)}`),
  ].join("\n");
  const text = body.length > SLACK_MAX_TEXT ? `${body.slice(0, SLACK_MAX_TEXT)}\n…truncated` : body;

  await Promise.all(webhooks.map(({ url }) => notifySlack(text, url)));

  return { total, high: topRows.length };
}
