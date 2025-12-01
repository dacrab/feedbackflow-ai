/**
 * Send a Slack notification to a specific webhook URL
 */
export async function notifySlackTo(url: string, text: string): Promise<void> {
  if (!url) {
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // ignore webhook errors in production flow
  }
}

/**
 * Send a Slack notification to the global webhook (from env)
 */
export async function notifySlack(text: string): Promise<void> {
  const url = process.env["SLACK_WEBHOOK_URL"];
  if (!url) {
    return;
  }
  await notifySlackTo(url, text);
}
