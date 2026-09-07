import { z } from "zod";

export const SSEMessageSchema = z.object({ stage: z.string(), message: z.string() });
export type SSEMessage = z.infer<typeof SSEMessageSchema>;

/** Parse one `data: ` block; returns null for malformed or wrong-shape
 * payloads so the stream keeps flowing instead of aborting. */
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      if (!block.startsWith("data: ")) continue;
      const event = parseSSEBlock(block);
      if (event) onEvent(event);
    }
  }
}
