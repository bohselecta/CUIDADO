import type { ControlSignals } from "@/types";

const BASE = process.env.HELPER_BASE_URL || "https://api.openai.com";
const MODEL = process.env.HELPER_MODEL || "gpt-4o-mini"; // fallback
const KEY   = process.env.HELPER_API_KEY || "";
const TIMEOUT = Number(process.env.HELPER_TIMEOUT_MS ?? 60000);

// In-memory very simple hour bucket for budget
let bucket = { windowStart: 0, used: 0 };

export function helperBudgetOk(): boolean {
  const limit = Number(process.env.HELPER_MAX_TURNS_PER_HOUR ?? 30);
  const now = Date.now();
  if (bucket.windowStart === 0 || now - bucket.windowStart > 3600_000) {
    bucket = { windowStart: now, used: 0 };
  }
  return bucket.used < limit;
}
function consumeBudget() { bucket.used += 1; }

export function helperShouldEngage(sig: ControlSignals): boolean {
  if (String(process.env.HELPER_ENABLE).toLowerCase() !== "true") return false;
  const tU = Number(process.env.HELPER_TRIGGER_U ?? 0.65);
  const tN = Number(process.env.HELPER_TRIGGER_N ?? 0.65);
  const tV = Number(process.env.HELPER_TRIGGER_V ?? 0.55);
  return sig.uncertainty >= tU || sig.novelty >= tN || sig.valueAtRisk >= tV;
}

// Redact/clip long text to protect tokens/cost and avoid chain-of-thought leakage.
function clip(s: string, max = 6000) {
  const lim = Number(process.env.HELPER_MAX_CHARS_IN ?? max);
  return s.length > lim ? (s.slice(0, lim) + "…") : s;
}

/**
 * Ask the helper to produce a refined final answer from:
 * - brief task summary
 * - optional context snippets (bulleted)
 * - the local draft
 * The prompt explicitly asks for FINAL ANSWER only (no chain-of-thought).
 */
export async function helperRefine(opts: {
  userMsg: string;
  contextBullets: string[];
  localDraft: string;
  signals: ControlSignals;
}): Promise<{ answer: string }> {
  if (!KEY) throw new Error("Missing HELPER_API_KEY");

  const sys = [
    "You are a senior assistant that refines answers for clarity, factual care, and succinct structure.",
    "Return ONLY the improved final answer—no reasoning steps. Use bullets/sections where helpful.",
    "If the question is risky (medical/finance/legal), include a brief disclaimer and safer alternatives."
  ].join(" ");

  const context = opts.contextBullets.slice(0, 8).join("\n");
  const user = [
    `Task: ${clip(opts.userMsg)}`,
    context ? `\nContext:\n${clip(context, 2000)}` : "",
    `\nLocal draft to refine:\n${clip(opts.localDraft)}`
  ].join("");

  const ctrl = new AbortController();
  const id = setTimeout(()=>ctrl.abort(), TIMEOUT);

  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KEY}`,
      "Content-Type": "application/json"
    },
    signal: ctrl.signal,
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.5,
      top_p: 0.9,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ]
    })
  }).finally(()=>clearTimeout(id));

  if (!res.ok) {
    const t = await res.text().catch(()=> "");
    throw new Error(`Helper HTTP ${res.status}: ${t}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const maxOut = Number(process.env.HELPER_MAX_CHARS_OUT ?? 6000);
  const answer = content.length > maxOut ? (content.slice(0, maxOut) + "…") : content;

  consumeBudget();
  return { answer: String(answer) };
}
