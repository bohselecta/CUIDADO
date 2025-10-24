const OLLAMA = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const EMBED_MODEL = process.env.EMBED_MODEL || "nomic-embed-text";

export async function embedTexts(texts: string[], timeoutMs = 60000): Promise<number[][]> {
  if (!texts.length) return [];
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  const res = await fetch(`${OLLAMA}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: ctrl.signal,
    body: JSON.stringify({ model: EMBED_MODEL, input: texts })
  }).finally(() => clearTimeout(id));

  if (!res.ok) {
    const t = await res.text().catch(()=> "");
    throw new Error(`Ollama embeddings ${res.status}: ${t}`);
  }
  const data = await res.json();
  // Ollama returns { embeddings: number[][] }
  const arr = data?.embeddings || data?.data?.map((d: any)=>d.embedding) || [];
  return arr as number[][];
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v || [];
}

// utils
export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.max(a.length, b.length);
  for (let i=0;i<n;i++) {
    const x = a[i] || 0, y = b[i] || 0;
    dot += x*y; na += x*x; nb += y*y;
  }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-9);
}

export function termOverlapScore(doc: string, q: string) {
  const tok = (s: string) => s.toLowerCase().split(/\W+/).filter(Boolean);
  const A = new Set(tok(doc)), Q = tok(q);
  let s = 0; for (const w of Q) if (A.has(w)) s++;
  return s;
}
