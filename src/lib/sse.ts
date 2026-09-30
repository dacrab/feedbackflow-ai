import { z } from "zod";

const SSEMessageSchema = z.object({ stage: z.string(), message: z.string() });
export type SSEMessage = z.infer<typeof SSEMessageSchema>;

// null for a malformed block, so one bad event cannot abort the stream.
function parseSSEBlock(block: string): SSEMessage | null {
  try {
    const parsed = SSEMessageSchema.safeParse(JSON.parse(block.slice("data: ".length)));
    return parsed.success ? parsed.data : null;
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
    if (!block.startsWith("data: ")) return;
    const event = parseSSEBlock(block);
    if (event) onEvent(event);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Flush the decoder and any event whose trailing blank line never
        // arrived: the final `complete` frame lands here.
        buffer += decoder.decode();
        for (const block of buffer.split("\n\n")) drain(block);
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const block of blocks) drain(block);
    }
  } finally {
    reader.releaseLock();
  }
}
