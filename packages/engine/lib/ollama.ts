const OLLAMA = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function ollamaChat(opts: {
  model?: string;
  messages: Msg[];
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  timeoutMs?: number;
}) {
  const {
    model = process.env.MODEL_PRIMARY || "mistral:7b-instruct",
    messages,
    temperature = Number(process.env.TEMP ?? 0.7),
    top_p = Number(process.env.TOP_P ?? 0.9),
    stream = false,
    timeoutMs = 60000
  } = opts;

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({ model, messages, temperature, top_p, stream })
    }).finally(() => clearTimeout(id));

    if (!res.ok) {
      // Retry once on 5xx errors
      if (res.status >= 500) {
        await new Promise(r => setTimeout(r, 250));
        const retryRes = await fetch(`${OLLAMA}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({ model, messages, temperature, top_p, stream })
        });
        
        if (!retryRes.ok) {
          const text = await retryRes.text().catch(() => "");
          throw new Error(`Ollama chat retry failed ${retryRes.status}: ${text}`);
        }
        
        const retryData = await retryRes.json();
        const content =
          retryData?.message?.content ??
          retryData?.choices?.[0]?.message?.content ??
          retryData?.response ??
          "";
        return String(content ?? "");
      }
      
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama chat ${res.status}: ${text}`);
    }

    const data = await res.json();
    // Defensive content extraction for various Ollama formats
    const content =
      data?.message?.content ??
      data?.choices?.[0]?.message?.content ??
      data?.response ??
      "";
    return String(content ?? "");
  } catch (error) {
    throw new Error(`Ollama chat error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function* ollamaChatStream(opts: {
  model?: string;
  messages: Msg[];
  temperature?: number;
  top_p?: number;
  timeoutMs?: number;
}): AsyncGenerator<string, void> {
  const {
    model = process.env.MODEL_PRIMARY || "mistral:7b-instruct",
    messages,
    temperature = Number(process.env.TEMP ?? 0.7),
    top_p = Number(process.env.TOP_P ?? 0.9),
    timeoutMs = 60000
  } = opts;

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({ model, messages, temperature, top_p, stream: true })
    }).finally(() => clearTimeout(id));

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama stream ${res.status}: ${text}`);
    }

    if (!res.body) {
      throw new Error("No response body for streaming");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const data = JSON.parse(line);
            const content = data?.message?.content || data?.delta?.content || "";
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip malformed JSON lines
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    throw new Error(`Ollama stream error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
