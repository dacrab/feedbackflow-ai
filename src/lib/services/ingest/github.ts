import "server-only";

import { z } from "zod";
import {
  GITHUB_MAX_PAGES,
  GITHUB_MAX_RETRIES,
  GITHUB_PER_PAGE,
  GITHUB_RETRY_BASE_DELAY_MS,
  GITHUB_TIMEOUT_MS,
} from "@/lib/constants";
import { withRetry } from "@/lib/utils";

const IssueSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string().nullable().optional(),
  created_at: z.string(),
  // The issues endpoint also returns pull requests; they carry this key.
  pull_request: z.unknown().optional(),
});
export type GithubIssue = z.infer<typeof IssueSchema>;

// Never succeeds on retry (revoked token, deleted repo, bad path). 429 does.
const FATAL_ERROR = /GitHub fetch failed: (401|403|404|422)/;

async function fetchPage(repo: string, page: number, token?: string): Promise<GithubIssue[]> {
  const url = `https://api.github.com/repos/${repo}/issues?state=open&per_page=${GITHUB_PER_PAGE}&page=${page}&sort=updated&direction=desc`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "feedbackflow-ai",
      Accept: "application/vnd.github+json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
  // A schema failure throws like a fetch failure, so API drift retries.
  return z.array(IssueSchema).parse(await res.json());
}

export async function fetchGithubIssues(repo: string, token?: string): Promise<GithubIssue[]> {
  const issues: GithubIssue[] = [];
  for (let page = 1; page <= GITHUB_MAX_PAGES; page++) {
    try {
      const batch = await withRetry(() => fetchPage(repo, page, token), {
        retries: GITHUB_MAX_RETRIES,
        baseDelay: GITHUB_RETRY_BASE_DELAY_MS,
        abortOn: FATAL_ERROR,
      });
      if (batch.length === 0) break;
      issues.push(...batch.filter((issue) => !issue.pull_request));
      if (batch.length < GITHUB_PER_PAGE) break;
    } catch (e) {
      if (page === 1) throw e; // nothing fetched yet, so fail loudly
      break; // keep what we have on later-page failures
    }
  }
  return issues;
}
