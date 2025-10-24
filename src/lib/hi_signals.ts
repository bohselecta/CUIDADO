import type { PredictedUserState, HInterfaceSignals } from "@/types";
import { computeInterfaceSignals } from "./env_voice";

export function computeHI(draft: string, pred: PredictedUserState): HInterfaceSignals {
  const env = computeInterfaceSignals();   // <-- NEW: from EVL
  const EN = env.EN;
  const PC = env.PC;

  const wantsBullets = pred.toneAdvice.includes("bullet-forward");
  const hasBullets = /\n\s*[-*•]/.test(draft);
  const bulletsMismatch = wantsBullets && !hasBullets ? 0.4 : 0.0;
  const isLong = draft.length > 1800 ? 0.3 : 0;

  const empathyGap = clamp01(bulletsMismatch + isLong);
  // Attention Risk increases with length and low engagement
  const attentionRisk = clamp01(((draft.length - 1600) / 2400) + (0.5 - EN) * 0.4);

  return { empathyGap, engagement: EN, pace: PC, attentionRisk };
}

const clamp01 = (x:number)=>Math.max(0,Math.min(1,x));
