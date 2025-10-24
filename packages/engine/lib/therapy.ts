import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

type ModeKey = "off"|"gottman"|"frankl"|"cbt"|"existential";

export type TherapyConfig = {
  default_mode: ModeKey;
  modes: Record<ModeKey, {
    label: string;
    principles: string[];
    techniques: string[];
    response_contract?: { 
      bullets_first?: boolean; 
      include_micro_steps?: boolean; 
      max_depth?: "low"|"medium"|"high";
      tone?: string;
      include_questions?: number;
      max_tokens_hint?: number;
    };
  }>;
  technique_prompts: Record<string, string>;
  safety_notes: string[];
};

export type TherapyFrame = {
  mode: ModeKey;
  block: string;
  techniques: string[];
  contract: {
    bullets_first?: boolean;
    include_micro_steps?: boolean;
    max_depth?: "low"|"medium"|"high";
    tone?: string;
    include_questions?: number;
    max_tokens_hint?: number;
  };
};

let CURRENT_MODE: ModeKey = "off";

const CONFIG_PATH = path.join(process.cwd(), "src/policy/therapy_modes.yaml");

function readConfig(): TherapyConfig {
  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  return YAML.parse(raw) as TherapyConfig;
}

export function getTherapyMode(): ModeKey { 
  return CURRENT_MODE; 
}

export function setTherapyMode(m: ModeKey) { 
  CURRENT_MODE = m; 
}

export function therapyFrame(userMsg: string, sessionSummary: string): TherapyFrame {
  const cfg = readConfig();
  const mode = CURRENT_MODE || cfg.default_mode || "off";
  const m = cfg.modes[mode];

  if (!m || mode === "off") {
    return { 
      mode, 
      block: "", 
      techniques: [], 
      contract: {} 
    };
  }

  // Minimal intervention planning: pick 2–3 techniques for this turn.
  const chosen = pickTechniques(m.techniques, 2);
  const prompts = chosen.map(t => `- ${t}: ${cfg.technique_prompts[t] || ""}`).join("\n");

  const contract = m.response_contract || {};
  const principles = (m.principles || []).map((p, i) => `${i+1}. ${p}`).join("\n");

  const block =
`[THERAPY FRAME]
MODE: ${m.label}
PRINCIPLES:
${principles}

INTERVENTION PLAN:
${prompts}

RESPONSE CONTRACT:
- bullets_first: ${String(!!contract.bullets_first)}
- include_micro_steps: ${String(!!contract.include_micro_steps)}
- max_depth: ${contract.max_depth || "medium"}
- tone: ${contract.tone || "collaborative"}

NOTES:
- Do not diagnose or claim to provide therapy.
- Be concise; invite user choice and agency.
`;

  return { mode, block, techniques: chosen, contract };
}

function pickTechniques(list: string[], n: number): string[] {
  if (!list || list.length === 0) return [];
  if (n >= list.length) return list;
  
  // deterministic pick to keep outputs stable per turn
  const out: string[] = [];
  for (let i = 0; i < list.length && out.length < n; i += Math.max(1, Math.floor(list.length / n))) {
    out.push(list[i]);
  }
  return out.slice(0, n);
}
