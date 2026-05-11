import {
  GITHUB_MAX_PAGES,
  GITHUB_MAX_RETRIES,
  GITHUB_PER_PAGE,
  GITHUB_RETRY_BASE_DELAY_MS,
} from "@/lib/constants";

interface GithubIssue {
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
): Promise<GithubIssue[]> {
  const url = `https://api.github.com/repos/${repo}/issues?state=all&since=${encodeURIComponent(sinceISO)}&per_page=${GITHUB_PER_PAGE}&page=${page}&sort=updated&direction=desc`;
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
  if (!Array.isArray(data)) return [];
  return data
    .filter((i) => !("pull_request" in i))
    .map(({ id, title, body, created_at }) => ({ id, title, body, created_at }));
}

export async function fetchGithubIssues(
  repo: string,
  sinceISO: string,
  token?: string,
): Promise<GithubIssue[]> {
  const results: GithubIssue[] = [];
  for (let page = 1; page <= GITHUB_MAX_PAGES; page++) {
    try {
      let lastErr: unknown;
      let batch: GithubIssue[] = [];
      for (let attempt = 0; attempt <= GITHUB_MAX_RETRIES; attempt++) {
        try {
          batch = await fetchPage(repo, sinceISO, page, token);
          break;
        } catch (err) {
          lastErr = err;
          if (attempt < GITHUB_MAX_RETRIES)
            await new Promise((r) => setTimeout(r, GITHUB_RETRY_BASE_DELAY_MS * (attempt + 1)));
        }
      }
      if (batch.length === 0 && lastErr) throw lastErr;
      if (!batch.length) break;
      results.push(...batch);
    } catch (e) {
      if (page === 1) throw e;
      break;
    }
  }
  return results;
}
