import type { ControlSignals, PlannerDecision } from "@/types";

export type PlanInputs = {
  msg: string;
  signals: ControlSignals;
  usedContextCount: number;
};

export function makePlan(i: PlanInputs): PlannerDecision {
  const { uncertainty: U, novelty: N, stability: S, valueAtRisk: V } = i.signals;

  // thresholds (tune later)
  const tU = 0.55, tN = 0.55, tV = 0.50;

  // Choose mode
  const thoughtful = U >= tU || N >= tN || V >= tV;

  if (!thoughtful) {
    return {
      mode: "fast",
      steps: [
        "retrieve",                 // already done in Phase 4
        "compose_policy_surface",   // Phase 6 will enrich
        "direct_answer"
      ],
      rationale: "Confidence adequate; low risk; deliver concise answer."
    };
  }

  // Thoughtful mode: add structure & verification
  const steps = [
    "retrieve_broaden",            // Phase 10 will deepen this
    "compose_policy_surface",
    "structure_first",             // outline or bullet skeleton
  ];

  if (V >= tV) steps.push("add_disclaimer");
  steps.push("direct_answer");
  if (U >= tU) steps.push("reflect_pass"); // self-check wording & clarity (later phases)

  return {
    mode: "thoughtful",
    steps,
    rationale: "High uncertainty/novelty/risk; use structure and checks."
  };
}
