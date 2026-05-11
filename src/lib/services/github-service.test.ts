import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGithubIssues } from "./github-service";

const mockIssue = (id: number) => ({
  id,
  title: `Issue ${id}`,
  body: "body",
  created_at: "2024-01-01T00:00:00Z",
});
const mockPR = (id: number) => ({ ...mockIssue(id), pull_request: { url: "..." } });

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.useRealTimers();
});

function okResponse(data: unknown[]) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
}

function failResponse(status = 500) {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) });
}

describe("fetchGithubIssues", () => {
  it("fetches single page of issues", async () => {
    mockFetch
      .mockReturnValueOnce(okResponse([mockIssue(1), mockIssue(2)]))
      .mockReturnValueOnce(okResponse([]));

    const result = await fetchGithubIssues("owner/repo", "2024-01-01T00:00:00Z");
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(1);
  });

  it("paginates multiple pages until empty", async () => {
    mockFetch
      .mockReturnValueOnce(okResponse([mockIssue(1)]))
      .mockReturnValueOnce(okResponse([mockIssue(2)]))
      .mockReturnValueOnce(okResponse([]));

    const result = await fetchGithubIssues("owner/repo", "2024-01-01T00:00:00Z");
    expect(result).toHaveLength(2);
  });

  it("filters out pull requests", async () => {
    mockFetch
      .mockReturnValueOnce(okResponse([mockIssue(1), mockPR(2), mockIssue(3)]))
      .mockReturnValueOnce(okResponse([]));

    const result = await fetchGithubIssues("owner/repo", "2024-01-01T00:00:00Z");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.id !== 2)).toBe(true);
  });

  it("retries on failure then succeeds", async () => {
    mockFetch
      .mockReturnValueOnce(failResponse())
      .mockReturnValueOnce(okResponse([mockIssue(1)]))
      .mockReturnValueOnce(okResponse([]));

    const promise = fetchGithubIssues("owner/repo", "2024-01-01T00:00:00Z");
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("throws when first page fails after all retries", async () => {
    mockFetch.mockReturnValue(failResponse());

    const promise = fetchGithubIssues("owner/repo", "2024-01-01T00:00:00Z");
    // Attach rejection handler immediately to avoid unhandled rejection
    const resultPromise = promise.catch((e) => e);
    await vi.advanceTimersByTimeAsync(10000);
    const err = await resultPromise;
    expect(err).toBeInstanceOf(Error);
    // 1 initial + 3 retries = 4 calls
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("stops silently when later pages fail", async () => {
    mockFetch.mockReturnValueOnce(okResponse([mockIssue(1)])).mockReturnValue(failResponse());

    const promise = fetchGithubIssues("owner/repo", "2024-01-01T00:00:00Z");
    await vi.advanceTimersByTimeAsync(10000);
    const result = await promise;
    expect(result).toHaveLength(1);
  });

  it("passes auth token in header when provided", async () => {
    mockFetch.mockReturnValueOnce(okResponse([mockIssue(1)])).mockReturnValueOnce(okResponse([]));

    await fetchGithubIssues("owner/repo", "2024-01-01T00:00:00Z", "my-token");
    const headers = mockFetch.mock.calls[0]?.[1]?.headers;
    expect(headers.Authorization).toBe("Bearer my-token");
  });
});
