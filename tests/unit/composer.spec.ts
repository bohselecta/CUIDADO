import { describe, it, expect } from "vitest";
import { composePolicySurface } from "../../src/lib/composer";

describe("composer", () => {
  it("includes key sections and respects budget", () => {
    const sys = composePolicySurface({
      taskHint: "test",
      tokenBudget: 400,
      signals: { uncertainty:0.1, novelty:0.1, stability:0.9, valueAtRisk:0.1 },
      mode: "fast",
      contextBlock: "[CONTEXT]\n- foo\n"
    });
    expect(sys).toContain("[PERSONA]");
    expect(sys).toContain("[CONSTITUTION]");
    expect(sys.length).toBeLessThan(400*4 + 50);
  });
});
