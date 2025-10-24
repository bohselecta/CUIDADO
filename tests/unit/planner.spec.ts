import { describe, it, expect } from "vitest";
import { makePlan } from "../../src/lib/planner";

describe("planner.makePlan", () => {
  it("chooses fast when U/N/V low", () => {
    const plan = makePlan({
      msg: "simple",
      signals: { uncertainty:0.1, novelty:0.2, stability:0.9, valueAtRisk:0.1 },
      usedContextCount: 2
    });
    expect(plan.mode).toBe("fast");
    expect(plan.steps).toContain("direct_answer");
  });

  it("chooses thoughtful when U high", () => {
    const plan = makePlan({
      msg: "hard",
      signals: { uncertainty:0.8, novelty:0.3, stability:0.3, valueAtRisk:0.2 },
      usedContextCount: 6
    });
    expect(plan.mode).toBe("thoughtful");
    expect(plan.steps).toContain("structure_first");
  });
});
