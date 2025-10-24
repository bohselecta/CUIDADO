import type { ControlSignals } from "@/types";

// Quick text features
const HEDGE_RX = /\b(maybe|perhaps|probably|it seems|it appears|might|could|unsure|unclear)\b/i;
const RISK_RX  = /\b(drug|dosage|medical|finance|investment|legal|weapon|explosive|hack|password|paywall|pii)\b/i;

export type SignalInputs = {
  userMsg: string;
  answerDraft: string;                // model's first-pass answer (Phase 5: we only run once)
  retrievalScores?: number[];         // dense/lex scores [0..1] (use top used items)
  tokensApprox?: number;              // quick length proxy
  userCriticality?: number;           // 0..1 (optional external weight)
};

export function computeSignals(i: SignalInputs): ControlSignals {
  const support = supportScore(i.retrievalScores || []);
  const hedge   = HEDGE_RX.test(i.answerDraft) ? 1 : 0;
  const len     = clamp01((i.tokensApprox || i.answerDraft.length) / 1600);

  // U: inverse of support + hedging + length penalty (long & vague -> higher U)
  const U = clamp01( (1 - support) * 0.55 + hedge * 0.35 + len * 0.10 );

  // N: lexical dissimilarity proxy: if support is low but message has new tokens -> higher novelty
  const msgUniq = uniqueRatio(i.userMsg);
  const N = clamp01( (1 - support) * 0.6 + msgUniq * 0.4 );

  // S: stability: high when support strong and hedging low; penalize sudden length spikes
  const S = clamp01( support * 0.7 + (1 - hedge) * 0.2 + (1 - Math.abs(len - 0.3)) * 0.1 );

  // V: value-at-risk: domain keywords + userCriticality boost + if U high while risky content present
  const risk = RISK_RX.test(i.userMsg) || RISK_RX.test(i.answerDraft) ? 1 : 0;
  const V = clamp01( risk * 0.6 + (i.userCriticality || 0) * 0.3 + U * 0.1 );

  return { uncertainty: U, novelty: N, stability: S, valueAtRisk: V };
}

// ---- helpers ----
function supportScore(scores: number[]) {
  if (!scores.length) return 0;
  // mean of top-3
  const s = [...scores].sort((a,b)=>b-a).slice(0,3);
  const m = s.reduce((p,c)=>p+c,0) / s.length;
  // normalize rough cosine/lex to [0..1]
  return clamp01(m);
}

function uniqueRatio(text: string) {
  const words = (text.toLowerCase().match(/\b[\w'-]+\b/g) || []).filter(w => w.length>2);
  if (!words.length) return 0;
  const uniq = new Set(words);
  return uniq.size / words.length; // 0..1
}

const clamp01 = (x:number)=>Math.max(0,Math.min(1,x));
