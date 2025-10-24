import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { latestLessons } from "@/lib/memory";
import { readPersona } from "@/lib/policy";

type Candidate = {
  id: string;
  title: string;
  reason: string;
  patch: any;           // partial persona object to merge
  diffPreview: string;  // simple human-readable diff
};

const PERSONA_PATH = path.join(process.cwd(), "src/policy/persona.yaml");

export function proposePromotions(limit = 80): Candidate[] {
  const lessons = latestLessons(limit);
  const txt = lessons.map(l => l.text.toLowerCase());
  const c = (kw: RegExp) => txt.filter(t => kw.test(t)).length;

  const counts = {
    bullets: c(/\bbullet|bullets-first|bulleted|bullets\b/),
    tldr:    c(/\btl;?dr\b/),
    code:    c(/\bcode-first|runnable code|code snippet|```/),
    retrieval: c(/\bretrieval|context used|fragments used/),
    thoughtful: c(/\bmode=thoughtful\b/),
    fast:       c(/\bmode=fast\b/),
  };

  const persona = readPersona() || {};
  const cand: Candidate[] = [];

  // 1) Bullets-first preference
  if (!get(persona, "format_prefs.bullets") && counts.bullets + counts.tldr >= 3) {
    cand.push(makeCandidate("format.bullets",
      "Enable bullets-first formatting",
      `Observed ${counts.bullets + counts.tldr} lessons mentioning bullets/TL;DR.`,
      { format_prefs: { ...(persona.format_prefs||{}), bullets: true } },
      persona));
  }

  // 2) Code-first preference
  if (!get(persona, "format_prefs.code_first") && counts.code >= 2) {
    cand.push(makeCandidate("format.code_first",
      "Prefer code-first answers",
      `Observed ${counts.code} lessons referencing code-first/snippets.`,
      { format_prefs: { ...(persona.format_prefs||{}), code_first: true } },
      persona));
  }

  // 3) Retrieval-first lexicon tag
  const hasRetrievalLex = (persona.brand_lexicon||[]).includes("retrieval-first");
  if (!hasRetrievalLex && counts.retrieval >= 3) {
    cand.push(makeCandidate("lexicon.retrieval_first",
      "Add 'retrieval-first' to brand lexicon",
      `Observed ${counts.retrieval} retrieval-oriented lessons.`,
      { brand_lexicon: uniq([...(persona.brand_lexicon||[]), "retrieval-first"]) },
      persona));
  }

  // 4) Tone: add 'deliberate' if thoughtful dominates
  const tone: string = persona.tone || "calm, precise, creative-technical";
  const thoughtfulDominant = counts.thoughtful >= 2 && counts.thoughtful > counts.fast;
  const willAddDeliberate = thoughtfulDominant && !tone.includes("deliberate");
  if (willAddDeliberate) {
    cand.push(makeCandidate("tone.deliberate",
      "Enrich tone with 'deliberate'",
      `Thoughtful mode appeared ${counts.thoughtful}× vs fast ${counts.fast}×.`,
      { tone: ensureWordInTone(tone, "deliberate") },
      persona));
  }

  return cand;
}

export function applyPromotion(candidateId: string): { applied: boolean; newContent?: string; backupPath?: string } {
  const persona = YAML.parse(fs.readFileSync(PERSONA_PATH, "utf8"));
  const all = proposePromotions(200);
  const match = all.find(x => x.id === candidateId);
  if (!match) return { applied: false };

  const updated = deepMerge(persona, match.patch);
  const newStr = YAML.stringify(updated);

  // backup
  const backup = PERSONA_PATH + "." + new Date().toISOString().replace(/[:.]/g,"-") + ".bak";
  fs.copyFileSync(PERSONA_PATH, backup);

  fs.writeFileSync(PERSONA_PATH, newStr, "utf8");
  return { applied: true, newContent: newStr, backupPath: backup };
}

// ---- helpers ----

function makeCandidate(id: string, title: string, reason: string, patch: any, persona: any): Candidate {
  const diff = simpleDiff(YAML.stringify(persona), YAML.stringify(deepMergeStructured(persona, patch)));
  return { id, title, reason, patch, diffPreview: diff };
}

function get(obj:any, dotted:string) {
  return dotted.split(".").reduce((acc,k)=> acc && acc[k], obj);
}

function uniq<T>(arr:T[]) { return Array.from(new Set(arr)); }

function ensureWordInTone(tone: string, word: string) {
  const parts = tone.split(",").map(s=>s.trim());
  if (!parts.includes(word)) parts.push(word);
  return parts.join(", ");
}

// shallow structural merge for preview (no mutation of original)
function deepMergeStructured(a:any, b:any) {
  if (Array.isArray(a) && Array.isArray(b)) return uniq([...(a as any[]), ...(b as any[])]);
  if (isObj(a) && isObj(b)) {
    const out:any = { ...a };
    for (const k of Object.keys(b)) out[k] = deepMergeStructured(a?.[k], b[k]);
    return out;
  }
  return b ?? a;
}

function deepMerge(a:any, b:any) {
  if (Array.isArray(a) && Array.isArray(b)) return uniq([...(a as any[]), ...(b as any[])]);
  if (isObj(a) && isObj(b)) {
    const out:any = { ...a };
    for (const k of Object.keys(b)) out[k] = deepMerge(a?.[k], b[k]);
    return out;
  }
  return b ?? a;
}

function isObj(x:any){ return x && typeof x === "object" && !Array.isArray(x); }

// tiny line-add diff (human-readable, not unified)
function simpleDiff(oldStr:string, newStr:string) {
  const oldSet = new Set(oldStr.split("\n"));
  const added = newStr.split("\n").filter(line => !oldSet.has(line));
  return added.map(l => "+ " + l).join("\n");
}
