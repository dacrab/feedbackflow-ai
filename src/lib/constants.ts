/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values
 */

// Content limits
export const MAX_RAW_CONTENT_LENGTH = 15000;
export const MAX_LLM_INPUT_LENGTH = 8000;
export const MAX_SUMMARY_PREVIEW_LENGTH = 50;

// Pagination defaults
export const DEFAULT_FEEDBACK_LIMIT = 100;
export const DEFAULT_ANALYSIS_BATCH_SIZE = 50;
export const DEFAULT_DASHBOARD_LIMIT = 1000;
export const MAX_DIGEST_ITEMS = 10;

// GitHub API
export const GITHUB_MAX_PAGES = 10;
export const GITHUB_PER_PAGE = 100;

// Time intervals (in hours)
export const HOURS_IN_DAY = 24;
export const INITIAL_FETCH_DAYS = 30;

// LLM configuration
export const LLM_MAX_RETRIES = 2;
export const LLM_MAX_TOPICS = 10;
export const LLM_MIN_SUMMARY_LENGTH = 5;
export const LLM_MAX_SUMMARY_LENGTH = 500;
export const LLM_RETRY_BASE_DELAY_MS = 500;

// Severity thresholds
export const HIGH_SEVERITY_THRESHOLD = 4;
export const MIN_SEVERITY = 1;
export const MAX_SEVERITY = 5;

// Retry configuration
export const GITHUB_RETRY_BASE_DELAY_MS = 400;
export const GITHUB_MAX_RETRIES = 3;
