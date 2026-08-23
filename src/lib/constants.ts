export const MAX_RAW_CONTENT_LENGTH = 8000; // cap stored content and LLM input

export const DEFAULT_FEEDBACK_LIMIT = 100;

export const GITHUB_PER_PAGE = 100;

export const LLM_MAX_RETRIES = 2;
export const LLM_MAX_TOPICS = 5;
export const LLM_RETRY_BASE_DELAY_MS = 1000;

export const HIGH_SEVERITY_THRESHOLD = 4;
export const MEDIUM_SEVERITY_THRESHOLD = 3;
export const MAX_SEVERITY = 5;

export const GITHUB_RETRY_BASE_DELAY_MS = 400;
export const GITHUB_MAX_RETRIES = 3;

export const MAX_SEARCH_TERM_LENGTH = 200;

export const DIGEST_WINDOW_HOURS = 24;

export const SLACK_TIMEOUT_MS = 10_000;

export const DASHBOARD_TOP_TOPICS = 10;

export const RATE_LIMITS = {
  action: { maxRequests: 20, windowMs: 60_000 },
  llm: { maxRequests: 15, windowMs: 60_000 },
  sync: { maxRequests: 5, windowMs: 60_000 },
  cron: { maxRequests: 10, windowMs: 60_000 },
} as const;

// Cap for the fire-and-forget ingest kicked off after adding a source.
export const ADD_SOURCE_INGEST_LIMIT = 20;
