// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSyncStream } from "./use-sync-stream";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function sseResponse(events: { stage: string; message: string }[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(ctrl) {
        for (const e of events) ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
        ctrl.close();
      },
    }),
  );
}

function stubFetch(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

describe("useSyncStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports each non-progress event as its own log line", async () => {
    stubFetch(
      sseResponse([
        { stage: "fetching", message: "fetching from acme/repo..." },
        { stage: "fetching", message: "fetched 3 items" },
      ]),
    );
    const { result } = renderHook(() => useSyncStream());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.logs.map((l) => l.msg)).toEqual([
      "connecting...",
      "fetching from acme/repo...",
      "fetched 3 items",
    ]);
  });

  it("coalesces consecutive progress stages into one line", async () => {
    stubFetch(
      sseResponse([
        { stage: "analyzing", message: "analyzing 1/3..." },
        { stage: "analyzing", message: "analyzing 2/3..." },
        { stage: "analysis_ok", message: "analyzed 1/3" },
      ]),
    );
    const { result } = renderHook(() => useSyncStream());

    await act(async () => {
      await result.current.start();
    });

    // Without the progress-line check, the final event would erase "analyzing
    // 1/3" and leave a line per event.
    expect(result.current.logs.map((l) => l.msg)).toEqual(["connecting...", "analyzed 1/3"]);
    expect(result.current.logs.at(-1)?.ok).toBe(true);
  });

  it("keeps a completed step when progress resumes afterwards", async () => {
    stubFetch(
      sseResponse([
        { stage: "fetching", message: "fetched 100 items" },
        { stage: "analyzing", message: "analyzing 1/3..." },
        { stage: "analyzing", message: "analyzing 2/3..." },
      ]),
    );
    const { result } = renderHook(() => useSyncStream());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.logs.map((l) => l.msg)).toEqual([
      "connecting...",
      "fetched 100 items",
      "analyzing 2/3...",
    ]);
  });

  it("marks a failed stage and clears the syncing flag", async () => {
    stubFetch(sseResponse([{ stage: "error", message: "sync failed" }]));
    const { result } = renderHook(() => useSyncStream());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.syncing).toBe(false));
    expect(result.current.logs.at(-1)).toMatchObject({ msg: "sync failed", ok: false });
  });

  it("logs a line when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    const { result } = renderHook(() => useSyncStream());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.syncing).toBe(false));
    expect(result.current.logs.at(-1)).toMatchObject({ msg: "sync failed", ok: false });
  });

  it("records a cancellation without failing", async () => {
    // Rejects when the hook's own signal aborts, which is what cancel() does.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => {
              reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
            });
          }),
      ),
    );
    const { result } = renderHook(() => useSyncStream());

    await act(async () => {
      const run = result.current.start();
      result.current.cancel();
      await run;
    });

    expect(result.current.logs.at(-1)?.msg).toBe("cancelled");
    expect(result.current.syncing).toBe(false);
  });
});
