/**
 * Consolidated notification service
 */

import { decrypt } from "@/lib/crypto";
import { notifySlack, notifySlackTo } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const admin = createAdminClient();
  const message = `High severity (${analysis.severity_score}) feedback detected: ${analysis.summary}`;

  // Get user-specific Slack webhooks
  const { data: hooks } = await admin
    .from("user_notifications")
    .select("type, secret_cipher, enabled")
    .eq("user_id", userId)
    .eq("enabled", true);

  // Send to user-specific webhooks
  for (const hook of hooks || []) {
    if (hook.type === "slack" && hook.secret_cipher) {
      try {
        const url = decrypt(hook.secret_cipher as string);
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
  const admin = createAdminClient();

  // Get user's feedback analyses
  const { data, error } = await admin
    .from("feedback_analyses")
    .select("summary, severity_score, sentiment, created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const analyses = data || [];
  const highSeverity = analyses.filter((a) => a.severity_score >= 4);

  // Get user's notification webhooks
  const { data: hooks } = await admin
    .from("user_notifications")
    .select("type, secret_cipher, enabled")
    .eq("user_id", userId)
    .eq("enabled", true);

  const summary = `Daily digest: ${analyses.length} analyses in last 24h. High severity: ${highSeverity.length}.`;

  // Send to user-specific webhooks
  for (const hook of hooks || []) {
    if (hook.type === "slack" && hook.secret_cipher) {
      try {
        const url = decrypt(hook.secret_cipher as string);
        if (url) {
          await notifySlackTo(url, summary);
          // Send top high-severity items
          for (const item of highSeverity.slice(0, 10)) {
            await notifySlackTo(url, `• [sev ${item.severity_score}] ${item.summary}`);
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
