import { describe, it, expect } from "vitest";
import { computeSignals } from "../../src/lib/controller";

describe("controller.computeSignals", () => {
  it("raises U when support low + hedging", () => {
    const sig = computeSignals({
      userMsg: "what is this?",
      answerDraft: "It might be, perhaps, unclear.",
      retrievalScores: [0.1, 0.0],
      tokensApprox: 120,
      userCriticality: 0
    });
    expect(sig.uncertainty).toBeGreaterThan(0.5);
    expect(sig.stability).toBeLessThan(0.7);
  });

  it("raises V on risky terms even with decent support", () => {
    const sig = computeSignals({
      userMsg: "what dosage should I take?",
      answerDraft: "I cannot advise on dosage.",
      retrievalScores: [0.8, 0.7], 
      tokensApprox: 80,
      userCriticality: 0
    });
    expect(sig.valueAtRisk).toBeGreaterThan(0.4);
  });
});
