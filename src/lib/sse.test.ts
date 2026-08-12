import { describe, expect, it } from "vitest";
import { parseSSEStream } from "@/lib/sse";

function streamOf(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(ctrl) {
        for (const c of chunks) ctrl.enqueue(encoder.encode(c));
        ctrl.close();
      },
    }),
  );
}

describe("parseSSEStream", () => {
  it("parses a complete data event", async () => {
    const events: Array<{ stage: string; message: string }> = [];
    await parseSSEStream(streamOf(['data: {"stage":"complete","message":"done"}\n\n']), (e) =>
      events.push(e),
    );
    expect(events).toEqual([{ stage: "complete", message: "done" }]);
  });

  it("handles events split across chunks", async () => {
    const events: Array<{ stage: string; message: string }> = [];
    await parseSSEStream(streamOf(['data: {"stage":"f', 'etching","message":"hi"}\n', "\n"]), (e) =>
      events.push(e),
    );
    expect(events).toEqual([{ stage: "fetching", message: "hi" }]);
  });

  it("skips malformed JSON without aborting", async () => {
    const events: Array<{ stage: string; message: string }> = [];
    await parseSSEStream(
      streamOf(['data: {not json}\n\ndata: {"stage":"ok","message":"fine"}\n\n']),
      (e) => events.push(e),
    );
    expect(events).toEqual([{ stage: "ok", message: "fine" }]);
  });

  it("ignores non-data blocks", async () => {
    const events: Array<{ stage: string; message: string }> = [];
    await parseSSEStream(streamOf([": keep-alive\nevent: x\n\n"]), (e) => events.push(e));
    expect(events).toEqual([]);
  });
});
