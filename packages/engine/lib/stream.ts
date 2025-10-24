import { NextResponse } from "next/server";

export function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  };
}

export async function* streamChunks(generator: AsyncGenerator<string, void>) {
  for await (const chunk of generator) {
    yield `data: ${chunk}\n\n`;
  }
  yield "event: end\ndata: [DONE]\n\n";
}

export function toReadableStream(gen: AsyncGenerator<string, void>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of gen) {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }
      controller.enqueue(encoder.encode("event: end\ndata: [DONE]\n\n"));
      controller.close();
    },
  });
}
