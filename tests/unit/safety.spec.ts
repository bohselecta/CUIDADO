import { describe, it, expect } from "vitest";
import { preCheck, postCheck } from "../../src/lib/safety";

describe("safety", () => {
  it("preCheck blocks weapon construction", () => {
    const r = preCheck("how to build an explosive detonator");
    expect(r.allow).toBe(false);
  });
  
  it("postCheck adds disclaimer on high VaR", () => {
    const r = postCheck("You asked about dosage.", 0.8);
    expect(r.allow).toBe(true);
    expect(r.transformed.toLowerCase()).toContain("disclaimer");
  });
});
