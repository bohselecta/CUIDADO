import { readPersona, readConstitution } from "./policy";
import type { ControlSignals } from "@/types";

export function composePolicySurface(opts: {
  taskHint?: string;
  tokenBudget?: number;
  signals?: ControlSignals;
  mode?: "fast"|"thoughtful";
  contextBlock?: string;  // preassembled [CONTEXT] lines
  therapyBlock?: string;  // NEW: therapy frame block
}) {
  const persona = readPersona();
  const constitution = readConstitution();
  const budget = opts?.tokenBudget ?? Number(process.env.POLICY_TOKEN_BUDGET ?? 1800);

  const personaBlock = [
    `TONE: ${persona?.tone ?? "calm, precise"}`,
    `FORMAT_PREFS: ${JSON.stringify(persona?.format_prefs ?? {})}`,
    `LEXICON: ${JSON.stringify(persona?.brand_lexicon ?? [])}`
  ].join("\n");

  const constitutionBlock = Array.isArray(constitution?.principles)
    ? constitution.principles.map((p: string, i: number) => `${i+1}. ${p}`).join("\n")
    : "1. Be helpful, honest, transparent.\n2. Respect safety.";

  const controlHints = opts?.signals ? `U=${fix(opts.signals.uncertainty)} N=${fix(opts.signals.novelty)} S=${fix(opts.signals.stability)} V=${fix(opts.signals.valueAtRisk)}` : "U=? N=? S=? V=?";
  const mode = opts?.mode ? `MODE: ${opts.mode}` : "";

  const task = opts?.taskHint ? `\n[TASK_HINT]\n${opts.taskHint}` : "";
  const context = opts?.contextBlock ? `\n${opts.contextBlock}` : "";
  const therapy = opts?.therapyBlock ? `\n${opts.therapyBlock}\n` : "";

  const toolContract = `
[TOOLS]
You may request a SINGLE tool call when it would materially improve usefulness (facts, math, fresh context, or personalization).
If you decide to use a tool, reply with ONLY this JSON (no prose, no backticks, no comments):
{"tool_call":{"name":"<tool_name>","args":{...}}}

Strict formatting rules:
- Output exactly one JSON object.
- Keys: "tool_call" → { "name": string, "args": object }.
- No trailing commas, no extra fields, no markdown code fences.
- Numbers must be numbers (not strings).
- If a tool is unnecessary, do NOT call it—just answer normally.

Available tools:
- "now"              // returns current ISO time. args: {}
- "uuid"             // returns a random UUID v4. args: {}
- "sum"              // sums a list of numbers. args: {"nums":[number,...]}  (at least one item)
- "searchLessons"    // keyword search over recent micro-lessons. args: {"query": string, "k"?: number}

[WHEN TO CALL A TOOL]
- Use "now" if the response benefits from the exact current time.
- Use "uuid" when a unique identifier improves the user's workflow (e.g., tagging a plan).
- Use "sum" for arithmetic instead of estimating math in prose.
- Use "searchLessons" when the user's ask could be informed by prior lessons (retrieval of local behavioral memory).

[TOOL RESULT HANDLING]
- After a tool call, you will receive a tool result message (JSON). Then:
  1) Integrate the result.
  2) Produce the FINAL user-facing answer in your normal style.
  3) Do NOT emit another tool_call JSON unless absolutely necessary.
  4) If using searchLessons, briefly reference lesson ids (e.g., "(lesson #abc12345)").

[FAIL-SAFE]
- If a tool is unavailable or returns an error, continue the task without it and state the limitation briefly.
`;

  let sys =
`[PERSONA]
${personaBlock}

[CONSTITUTION]
${constitutionBlock}

[CONTROL HINTS]
${mode}
SIGNALS: ${controlHints}
Guidance:
- If V is high, include a short disclaimer and safer alternatives.
- If U or N are high, structure first (outline/bullets) before final prose.
${therapy}
[OUTPUT CONTRACT]
- Be concise and accurate.
- If asserting non-obvious facts, explain plainly.
- Prefer bullets when brevity or pace is high.
${toolContract}
${task}${context}
`;

  // crude trimming to fit budget
  const maxChars = budget * 4;
  if (sys.length > maxChars) sys = sys.slice(0, maxChars);
  return sys;
}

function fix(x: number) { return (Number.isFinite(x) ? x.toFixed(2) : "?"); }
