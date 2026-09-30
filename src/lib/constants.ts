export const PROVISIONING_MESSAGE = "account is being provisioned — please try again in a moment";

export const MAX_RAW_CONTENT_LENGTH = 8000; // cap stored content and LLM input
export const MAX_SEARCH_TERM_LENGTH = 200;
export const INBOX_PAGE_SIZE = 20;
export const SECRET_MAX_LENGTH = 512;

/** Chars of raw content the inbox list loads per row; the full body stays on the
 *  detail page. */
export const PREVIEW_CONTENT_CHARS = 240;

/** Display name. Deliberately not reused by crypto.ts's SALT (a KDF parameter
 *  whose value must never change) or by the GitHub User-Agent token. */
export const APP_NAME = "FeedbackFlow";

/** Server-side redirect targets. JSX links stay literal: a wrong one is visible
 *  immediately, while a wrong redirect silently bounces users to Clerk's hosted
 *  portal or lands a 404 after logout. */
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";

/** Written by the sidebar and read by the (protected) layout, so the two cannot
 *  disagree on the name of the collapse preference. */
export const SIDEBAR_COLLAPSED_COOKIE = "sidebar-collapsed";
export const SIDEBAR_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export const GITHUB_PER_PAGE = 100;
// Upper bound on pages fetched per repo so a huge backlog can't pin a
// user-triggered sync (and its SSE stream) for the whole maxDuration window.
// The cap exits like a normal completion: partial results are kept.
export const GITHUB_MAX_PAGES = 10;
export const GITHUB_MAX_RETRIES = 3;
export const GITHUB_RETRY_BASE_DELAY_MS = 400;
export const GITHUB_TIMEOUT_MS = 30_000;

export const LLM_MAX_RETRIES = 2;
export const LLM_MAX_TOPICS = 5;

export const HIGH_SEVERITY_THRESHOLD = 4;
export const MAX_SEVERITY = 5;

export const SLACK_TIMEOUT_MS = 10_000;

export const DIGEST_WINDOW_HOURS = 24;
/** Slack rejects oversized payloads; keep us comfortably under its cap. */
export const SLACK_MAX_TEXT = 3500;

// Cap for the fire-and-forget ingest kicked off after adding a source.
export const ADD_SOURCE_INGEST_LIMIT = 20;

// Duration units, so the policy windows below read as lengths instead of ms
// math. Kept module-private: only the exported windows below have readers.
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** A run older than this is assumed killed by the platform (`/api/sync` sets
 *  maxDuration = 300) and is reclaimed by the next sync. */
export const ACTIVE_RUN_WINDOW_MS = 10 * MINUTE_MS;

/** Ingest-run history the nightly cron keeps. Settings only ever shows the
 *  latest run, so older rows are storage cost with no reader. */
export const RUN_RETENTION_MS = 30 * DAY_MS;

const RATE_LIMIT_WINDOW_MS = MINUTE_MS;

export const RATE_LIMITS = {
  action: { maxRequests: 20, windowMs: RATE_LIMIT_WINDOW_MS },
  llm: { maxRequests: 15, windowMs: RATE_LIMIT_WINDOW_MS },
  sync: { maxRequests: 5, windowMs: RATE_LIMIT_WINDOW_MS },
  cron: { maxRequests: 10, windowMs: RATE_LIMIT_WINDOW_MS },
} as const;
