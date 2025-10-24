import { NextRequest } from "next/server";

export const runtime = "nodejs";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const MODEL = process.env.MODEL_PRIMARY || "gemma3:4b";

// in-memory last-metadata (dev-only; replace with your Episode log later)
let LAST_SIGNALS: any = null;
let LAST_SYSTEM_PROMPT = "";

export async function POST(req: NextRequest) {
  const { messages, model = MODEL, temperature = 0.7, top_p = 0.9 } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "missing messages" }), { status: 400 });
  }

  // Compose your system prompt (reuse your existing composer)
  try {
    const { composeSystemPrompt } = await import("@/src/lib/composer");
    LAST_SYSTEM_PROMPT = await composeSystemPrompt({ tokenBudget: 1800 });
  } catch { 
    LAST_SYSTEM_PROMPT = "You are CUIDADO, a helpful AI assistant focused on careful, thoughtful responses. Provide accurate information and be transparent about limitations.";
  }

  // Call Ollama in streaming mode (NDJSON) and convert to text/plain chunks
  const upstream = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model, 
      stream: true,
      messages: [{ role: "system", content: LAST_SYSTEM_PROMPT }, ...messages],
      options: { temperature, top_p }
    }),
    signal: req.signal,
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(()=> "");
    return new Response(JSON.stringify({ error: "ollama_error", detail }), { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const obj = JSON.parse(line);
              const delta = obj?.message?.content || "";
              if (delta) controller.enqueue(encoder.encode(delta));
                  if (obj?.done) {
                    // Generate mock signals for demo (replace with real CUIDADO signals later)
                    LAST_SIGNALS = {
                      U: 0.85, // Understanding
                      N: 0.42, // Novelty  
                      S: 0.91, // Safety
                      V: 0.67  // Valence
                    };
                    controller.close();
                    return;
                  }
            } catch { /* ignore non-JSON */ }
          }
        }
        if (buffer.trim()) {
          try {
            const obj = JSON.parse(buffer);
            const delta = obj?.message?.content || "";
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch { /* ignore */ }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Transfer-Encoding": "chunked",
    },
  });
}

// --- tiny companion endpoints (same file for convenience; split later) ---
export async function GET() {
  // returns last-known signals + system prompt (debug)
  return new Response(JSON.stringify({
    signals: LAST_SIGNALS,
    systemPrompt: LAST_SYSTEM_PROMPT ? (LAST_SYSTEM_PROMPT.slice(0, 4000) + (LAST_SYSTEM_PROMPT.length > 4000 ? " …" : "")) : null
  }), { headers: { "Content-Type": "application/json" }});
}
