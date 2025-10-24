export type SafetyFlag = {
  id: string; level: "info"|"warn"|"block";
  reason: string;
};

const RX = {
  // very small, conservative set; expand later
  selfHarm: /\b(kill myself|suicide|self\s*-?harm|end my life)\b/i,
  weapons:  /\b(explosive|bomb|improvised explosive|manufacture gun|ghost gun|silencer|detonator)\b/i,
  crime:    /\b(hack(?:ing)?\b|bypass(?:ing)?\b|crack password|credential stuffing|carding)\b/i,
  medical:  /\b(dosage|prescription|diagnos(e|is)|treat|contraindication|drug interaction)\b/i,
  finance:  /\b(insider trading|guaranteed returns|get rich quick|pump and dump)\b/i
};

export function preCheck(userMsg: string): { allow: boolean; flags: SafetyFlag[] } {
  const flags: SafetyFlag[] = [];
  if (RX.selfHarm.test(userMsg)) flags.push({ id: "self_harm", level: "block", reason: "self-harm intent" });
  if (RX.weapons.test(userMsg)) flags.push({ id: "weapons",  level: "block", reason: "weapon construction" });
  if (RX.crime.test(userMsg))   flags.push({ id: "crime",    level: "block", reason: "criminal facilitation" });

  // Risky-but-not-automatic-block domains:
  if (RX.medical.test(userMsg)) flags.push({ id: "medical_risk", level: "warn", reason: "medical guidance" });
  if (RX.finance.test(userMsg)) flags.push({ id: "finance_risk", level: "warn", reason: "financial guidance" });

  const block = flags.some(f => f.level === "block");
  return { allow: !block, flags };
}

export function postCheck(answer: string, vaR: number): {
  allow: boolean; flags: SafetyFlag[]; transformed: string;
} {
  const flags: SafetyFlag[] = [];
  // If VaR high, auto-attach a brief disclaimer footer
  let out = answer;

  if (vaR >= 0.5) {
    flags.push({ id: "high_var", level: "warn", reason: "value-at-risk high" });
    const hasDisc = /^(?=.*disclaimer)|^(?=.*consult)/im.test(answer);
    const footer = "\n\n— Disclaimer: This is not professional advice. Consider consulting a qualified professional for your situation.";
    if (!hasDisc) out += footer;
  }

  // Optional: redact obvious dangerous strings in draft (conservative)
  if (RX.weapons.test(answer) || RX.crime.test(answer)) {
    flags.push({ id: "redacted_detail", level: "block", reason: "unsafe technical detail" });
    out = "I can't help with that. I can offer high-level safety information or alternatives if that helps.";
    return { allow: false, flags, transformed: out };
  }

  return { allow: true, flags, transformed: out };
}
