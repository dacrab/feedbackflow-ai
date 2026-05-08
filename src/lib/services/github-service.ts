import {
  GITHUB_MAX_PAGES,
  GITHUB_MAX_RETRIES,
  GITHUB_PER_PAGE,
  GITHUB_RETRY_BASE_DELAY_MS,
} from "@/lib/constants";
import { withRetry } from "@/lib/retry";

export interface GithubIssue {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
}

async function fetchPage(
  repo: string,
  sinceISO: string,
  page: number,
  token?: string,
): Promise<Array<GithubIssue>> {
  const url = `https://api.github.com/repos/${repo}/issues?state=all&since=${encodeURIComponent(sinceISO)}&per_page=${GITHUB_PER_PAGE}&page=${page}&sort=updated&direction=desc`;

  const headers: Record<string, string> = {
    "User-Agent": "feedbackflow-ai",
    Accept: "application/vnd.github+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers, next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`GitHub fetch failed: ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((i) => !("pull_request" in i))
    .map(({ id, title, body, created_at }) => ({ id, title, body, created_at }));
}

export async function fetchGithubIssues(
  repo: string,
  sinceISO: string,
  token?: string,
): Promise<Array<GithubIssue>> {
  const results: Array<GithubIssue> = [];

  for (let page = 1; page <= GITHUB_MAX_PAGES; page++) {
    try {
      const batch = await withRetry(
        () => fetchPage(repo, sinceISO, page, token),
        GITHUB_MAX_RETRIES,
        GITHUB_RETRY_BASE_DELAY_MS,
      );
      if (batch.length === 0) {
        break;
      }
      results.push(...batch);
    } catch (e) {
      if (page === 1) {
        throw e;
      }
      break;
    }
  }

  return results;
}
