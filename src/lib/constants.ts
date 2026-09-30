/** Only the values that two or more files have to agree on. Anything a single
 *  file owns lives in that file as a named const — centralising it would add a
 *  hop without protecting anything. */

/** Display name. Deliberately not reused by crypto.ts's SALT (a KDF parameter
 *  whose value must never change) or by the GitHub User-Agent token. */
export const APP_NAME = "FeedbackFlow";

/** Thrown when a user row is missing. The protected error boundary compares the
 *  message verbatim to render a retry instead of a crash, so producer and
 *  reader cannot drift apart. */
export const PROVISIONING_MESSAGE = "account is being provisioned — please try again in a moment";

/** Server-side redirect targets. JSX links stay literal: a wrong one is visible
 *  immediately, while a wrong redirect silently bounces users to Clerk's hosted
 *  portal or lands a 404 after logout. */
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";

/** Written by the sidebar and read by the (protected) layout, so the two cannot
 *  disagree on the name of the collapse preference. */
export const SIDEBAR_COLLAPSED_COOKIE = "sidebar-collapsed";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Written by ingest and sent to the model: one cap, or the model sees more
 *  than what was stored. */
export const MAX_RAW_CONTENT_LENGTH = 8000;

/** Bounds the inbox filter box and the query that runs it. */
export const MAX_SEARCH_TERM_LENGTH = 200;

/** llm.ts states this range in the prompt and types.ts validates the answer
 *  against it; if they drift, the model is asked for what the schema rejects. */
export const LLM_MAX_TOPICS = 5;

export const HIGH_SEVERITY_THRESHOLD = 4;
export const MAX_SEVERITY = 5;

/** Stated in both the digest body and the Slack header that names the window. */
export const DIGEST_WINDOW_HOURS = 24;

const MINUTE_MS = 60_000;

/** Per-user ceilings, charged before any expensive work. */
export const RATE_LIMITS = {
  action: { maxRequests: 20, windowMs: MINUTE_MS },
  llm: { maxRequests: 15, windowMs: MINUTE_MS },
  sync: { maxRequests: 5, windowMs: MINUTE_MS },
  cron: { maxRequests: 10, windowMs: MINUTE_MS },
} as const;
