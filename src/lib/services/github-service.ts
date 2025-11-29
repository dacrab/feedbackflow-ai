/**
 * GitHub API service for fetching issues
 */

export interface GithubIssue {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
}

const MAX_PAGES = 3;
const PER_PAGE = 50;
const MAX_RETRIES = 3;

async function fetchPage(
  repo: string,
  sinceISO: string,
  page: number,
  token?: string,
): Promise<GithubIssue[]> {
  const url = `https://api.github.com/repos/${repo}/issues?state=all&since=${encodeURIComponent(sinceISO)}&per_page=${PER_PAGE}&page=${page}&sort=updated&direction=desc`;

  const headers: Record<string, string> = {
    "User-Agent": "feedbackflow-ai",
    Accept: "application/vnd.github+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data
    .filter((i) => !("pull_request" in i))
    .map(({ id, title, body, created_at }) => ({ id, title, body, created_at }));
}

async function fetchWithRetry(
  repo: string,
  sinceISO: string,
  page: number,
  token?: string,
): Promise<GithubIssue[]> {
  let lastErr: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fetchPage(repo, sinceISO, page, token);
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }

  throw lastErr;
}

export async function fetchGithubIssues(
  repo: string,
  sinceISO: string,
  token?: string,
): Promise<GithubIssue[]> {
  const results: GithubIssue[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const batch = await fetchWithRetry(repo, sinceISO, page, token);
      if (batch.length === 0) break;
      results.push(...batch);
    } catch (e) {
      if (page === 1) throw e;
      break;
    }
  }

  return results;
}
