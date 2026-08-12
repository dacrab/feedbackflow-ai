export interface SSEMessage {
  stage: string;
  message: string;
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
      try {
        onEvent(JSON.parse(block.slice("data: ".length)) as SSEMessage);
      } catch {
        // Skip malformed events instead of aborting the whole stream.
      }
    }
  }
}
