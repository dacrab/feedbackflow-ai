// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGithubIssues } from "./github";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

interface Issue {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
  pull_request?: unknown;
}

function issue(id: number, extra: Partial<Issue> = {}): Issue {
  return { id, title: `t${id}`, body: null, created_at: "2024-01-01T00:00:00Z", ...extra };
}

function pages(...batches: Issue[][]) {
  const responses = batches.map((b) => ({ ok: true, json: async () => b }));
  return vi.fn(async (url: string) => {
    const page = Number(new URL(url).searchParams.get("page") ?? 1);
    const r = responses[page - 1] ?? { ok: true, json: async () => [] };
    return { status: 200, ...r } as Response;
  });
}

describe("fetchGithubIssues", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("drops pull requests, which the issues endpoint also returns", async () => {
    vi.stubGlobal("fetch", pages([issue(1), issue(2, { pull_request: {} }), issue(3)]));
    const issues = await fetchGithubIssues("acme/repo");
    expect(issues.map((i) => i.id)).toEqual([1, 3]);
  });

  it("sends the token as a bearer header when one is given", async () => {
    const fetchMock = pages([issue(1)]);
    vi.stubGlobal("fetch", fetchMock);

    await fetchGithubIssues("acme/repo", "gh-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer gh-token" }),
      }),
    );
  });

  it("stops on a short page instead of paging to the cap", async () => {
    const fetchMock = pages([issue(1), issue(2)]);
    vi.stubGlobal("fetch", fetchMock);

    await fetchGithubIssues("acme/repo");

    // 2 results < PER_PAGE, so exactly one request.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fetches a full page and then stops", async () => {
    const full = Array.from({ length: 100 }, (_, i) => issue(i + 1));
    const fetchMock = pages(full, [issue(999)]);
    vi.stubGlobal("fetch", fetchMock);

    const issues = await fetchGithubIssues("acme/repo");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(issues.at(-1)?.id).toBe(999);
  });

  it("fails loudly when the first page fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404 }) as Response),
    );
    await expect(fetchGithubIssues("acme/gone")).rejects.toThrow("GitHub fetch failed: 404");
  });

  it("keeps partial results when a later page fails", async () => {
    // withRetry uses real setTimeout sleeps; fake timers would hang them.
    vi.useRealTimers();
    const full = Array.from({ length: 100 }, (_, i) => issue(i + 1));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const page = Number(new URL(url).searchParams.get("page") ?? 1);
        // A full first page makes it ask for page 2, which then fails.
        if (page === 1) return { ok: true, json: async () => full } as Response;
        return { ok: false, status: 500 } as Response;
      }),
    );
    // Retries are real sleeps; run them out.
    await expect(fetchGithubIssues("acme/repo")).resolves.toHaveLength(100);
  }, 15_000);

  it("stops on an empty page", async () => {
    const fetchMock = pages([]);
    vi.stubGlobal("fetch", fetchMock);

    const issues = await fetchGithubIssues("acme/repo");

    expect(issues).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a status that can never succeed", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 404 }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGithubIssues("acme/gone")).rejects.toThrow();

    // MAX_RETRIES is 3: a retry loop would make 4 calls.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
