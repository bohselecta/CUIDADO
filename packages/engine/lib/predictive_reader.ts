import type { PredictedUserState, UserModel, HInterfaceSignals } from "@/types";

// Heuristic simulator: uses user prefs to infer likely reading needs.
export function simulateReader(user: UserModel, sessionSummary: string, draft: string): PredictedUserState {
  const wantsCode   = user.stylePrefs.includes("code-first");
  const wantsBullets= user.stylePrefs.includes("bullets");
  const cognition = [
    wantsCode ? "prefer runnable snippets" : "prefer structure-first",
    "tie output to my stated goals/values"
  ];
  const affect = { valence: 0.1, arousal: 0.5, label: "neutral-focus" };
  const desiredOutcome = ["clear next steps", wantsCode ? "code snippet" : "outline"];
  const toneAdvice = [
    wantsBullets ? "bullet-forward" : "paragraph",
    user.traits.includes("direct") ? "direct" : "warm"
  ];
  return { cognition, affect, desiredOutcome, toneAdvice };
}

export function shapeResponse(draft: string, pred: PredictedUserState, hi: HInterfaceSignals): string {
  let out = draft;

  // TL;DR if pace fast or attention risk high
  if (hi.pace > 0.7 || hi.attentionRisk > 0.6) {
    const tldr = summarizeForTLDR(out);
    out = `TL;DR:\n${tldr}\n\n${out}`;
  }

  // Bullets-first if reader likely prefers bullet-forward
  if (pred.toneAdvice.includes("bullet-forward")) {
    out = bulletsFirst(out);
  }

  // Tighten wording if direct
  if (pred.toneAdvice.includes("direct")) {
    out = tighten(out);
  }

  return out;
}

// --- naive helpers (safe, deterministic) ---
function summarizeForTLDR(text: string) {
  return text.split("\n").filter(Boolean).slice(0,4).join("\n");
}
function bulletsFirst(text: string) {
  // promote paragraphs into bullet-like chunks
  return text.replace(/\n{2,}/g, "\n\n• ");
}
function tighten(text: string) {
  return text.replace(/\b(very|really|just|basically|kind of|actually)\b/gi, "").trim();
}
