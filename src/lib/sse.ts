import { z } from "zod";
import type { SyncStage } from "@/lib/types";

// Validated as a plain string, deliberately: a stage this build does not know
// still renders its message instead of dropping the event. The union is
// re-applied at the type level so the producer and the one consumer stay
// exhaustive, and this cast is the single place where the two meet.
const SSEMessageSchema = z.object({ stage: z.string(), message: z.string() });
export interface SSEMessage {
  stage: SyncStage;
  message: string;
}

const DATA_PREFIX = "data: ";

// null for a block that is not a data event, or holds malformed JSON, so one
// bad event cannot abort the stream.
function parseSSEBlock(block: string): SSEMessage | null {
  if (!block.startsWith(DATA_PREFIX)) return null;
  try {
    const parsed = SSEMessageSchema.safeParse(JSON.parse(block.slice(DATA_PREFIX.length)));
    return parsed.success
      ? { stage: parsed.data.stage as SyncStage, message: parsed.data.message }
      : null;
  } catch {
    return null;
  }
}

export async function parseSSEStream(
  response: Response,
  onEvent: (e: SSEMessage) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("no response body");
  const decoder = new TextDecoder();
  let buffer = "";

  const drain = (block: string) => {
    const event = parseSSEBlock(block);
    if (event) onEvent(event);
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        // Flush the decoder and any event whose trailing blank line never
        // arrived: the final `complete` frame lands here.
        buffer += decoder.decode();
        for (const block of buffer.split("\n\n")) drain(block);
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      // Hold back the trailing partial block; only complete ones are drained.
      const sep = buffer.lastIndexOf("\n\n");
      if (sep === -1) continue;
      for (const block of buffer.slice(0, sep).split("\n\n")) drain(block);
      buffer = buffer.slice(sep + 2);
    }
  } finally {
    reader.releaseLock();
  }
}
