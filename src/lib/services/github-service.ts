import { GITHUB_MAX_RETRIES, GITHUB_PER_PAGE, GITHUB_RETRY_BASE_DELAY_MS } from "@/lib/constants";

interface GithubIssue {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
}

async function fetchPage(
  repo: string,
  page: number,
  token?: string,
): Promise<{ issues: GithubIssue[]; rawCount: number }> {
  const url = `https://api.github.com/repos/${repo}/issues?state=open&per_page=${GITHUB_PER_PAGE}&page=${page}&sort=updated&direction=desc`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "feedbackflow-ai",
      Accept: "application/vnd.github+json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return { issues: [], rawCount: 0 };
  const issues = data
    .filter((i) => !("pull_request" in i))
    .map(({ id, title, body, created_at }) => ({ id, title, body, created_at }));
  return { issues, rawCount: data.length };
}

async function fetchPageWithRetry(
  repo: string,
  page: number,
  token?: string,
): Promise<{ issues: GithubIssue[]; rawCount: number }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= GITHUB_MAX_RETRIES; attempt++) {
    try {
      return await fetchPage(repo, page, token);
    } catch (err) {
      lastErr = err;
      if (attempt < GITHUB_MAX_RETRIES)
        await new Promise((r) => setTimeout(r, GITHUB_RETRY_BASE_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastErr;
}

export async function fetchGithubIssues(repo: string, token?: string): Promise<GithubIssue[]> {
  const results: GithubIssue[] = [];
  for (let page = 1; ; page++) {
    try {
      const { issues, rawCount } = await fetchPageWithRetry(repo, page, token);
      if (!rawCount) break;
      results.push(...issues);
      if (rawCount < GITHUB_PER_PAGE) break;
    } catch (e) {
      if (page === 1) throw e;
      break;
    }
  }
  return results;
}
