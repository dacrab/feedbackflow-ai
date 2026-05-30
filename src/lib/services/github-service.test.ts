import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GITHUB_MAX_RETRIES, GITHUB_PER_PAGE, GITHUB_RETRY_BASE_DELAY_MS } from "@/lib/constants";
import { fetchGithubIssues } from "./github-service";

const mockIssue = (id: number) => ({
  id,
  title: `Issue ${id}`,
  body: "body",
  created_at: "2024-01-01T00:00:00Z",
});
const mockPR = (id: number) => ({ ...mockIssue(id), pull_request: { url: "..." } });

const fullPage = (startId = 1) =>
  Array.from({ length: GITHUB_PER_PAGE }, (_, i) => mockIssue(startId + i));

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => vi.useRealTimers());

const ok = (data: unknown[]) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
const fail = (status = 500) =>
  Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) });

const REPO = "owner/repo";
const RETRY_WAIT = GITHUB_RETRY_BASE_DELAY_MS * GITHUB_MAX_RETRIES * 2;

describe("fetchGithubIssues", () => {
  it("returns issues from a single partial page (stops without fetching next)", async () => {
    mockFetch.mockReturnValueOnce(ok([mockIssue(1), mockIssue(2)]));
    const result = await fetchGithubIssues(REPO);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("paginates when pages are full, stops on partial page", async () => {
    mockFetch
      .mockReturnValueOnce(ok(fullPage(1)))
      .mockReturnValueOnce(ok([mockIssue(101), mockIssue(102)]));
    const result = await fetchGithubIssues(REPO);
    expect(result).toHaveLength(GITHUB_PER_PAGE + 2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("filters out pull requests", async () => {
    mockFetch.mockReturnValueOnce(ok([mockIssue(1), mockPR(2), mockIssue(3)]));
    const result = await fetchGithubIssues(REPO);
    expect(result).toHaveLength(2);
    expect(result.some((r) => r.id === 2)).toBe(false);
  });

  it("uses correct URL format", async () => {
    mockFetch.mockReturnValueOnce(ok([mockIssue(1)]));
    await fetchGithubIssues(REPO);
    const url: string = mockFetch.mock.calls[0]?.[0];
    expect(url).toContain("state=open");
    expect(url).toContain(REPO);
  });

  it("passes auth token as Bearer header", async () => {
    mockFetch.mockReturnValueOnce(ok([mockIssue(1)]));
    await fetchGithubIssues(REPO, "my-token");
    expect(mockFetch.mock.calls[0]?.[1]?.headers.Authorization).toBe("Bearer my-token");
  });

  it("retries on failure then succeeds", async () => {
    mockFetch.mockReturnValueOnce(fail()).mockReturnValueOnce(ok([mockIssue(1)]));
    const promise = fetchGithubIssues(REPO);
    await vi.advanceTimersByTimeAsync(RETRY_WAIT);
    expect(await promise).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting all retries on first page", async () => {
    mockFetch.mockReturnValue(fail());
    const promise = fetchGithubIssues(REPO).catch((e) => e);
    await vi.advanceTimersByTimeAsync(RETRY_WAIT);
    const err = await promise;
    expect(err).toBeInstanceOf(Error);
    expect(mockFetch).toHaveBeenCalledTimes(1 + GITHUB_MAX_RETRIES);
  });

  it("stops silently when a later page fails", async () => {
    mockFetch.mockReturnValueOnce(ok(fullPage(1))).mockReturnValue(fail());
    const promise = fetchGithubIssues(REPO);
    await vi.advanceTimersByTimeAsync(RETRY_WAIT);
    expect(await promise).toHaveLength(GITHUB_PER_PAGE);
  });
});
