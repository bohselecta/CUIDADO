import { computeSignals } from "../../src/lib/controller";
import { makePlan } from "../../src/lib/planner";
import { composePolicySurface } from "../../src/lib/composer";

const msg = "Give me a quick checklist to plan a workshop.";
const draft = "Here is a concise checklist with bullets and timing.";
const sig = computeSignals({
  userMsg: msg, 
  answerDraft: draft, 
  retrievalScores:[0.5,0.4], 
  tokensApprox: draft.length,
  userCriticality: 0
});
const plan = makePlan({ msg, signals: sig, usedContextCount: 2 });
const sys = composePolicySurface({
  taskHint: "smoke", 
  signals: sig, 
  mode: plan.mode, 
  contextBlock: ""
});

console.log("[SMOKE] U/N/S/V=", sig, "mode=", plan.mode, "sysChars=", sys.length);
