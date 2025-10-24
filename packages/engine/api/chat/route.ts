import { NextRequest, NextResponse } from "next/server";
import { composePolicySurface } from "@/lib/composer";
import { ollamaChat } from "@/lib/ollama";
import { embedOne } from "@/lib/embeddings";
import { fragmentsAll, backfillEmbeddings, writeOutcomeCard, addFragment, conceptsForFragment } from "@/lib/memory";
import { hybridRetrieve } from "@/lib/retrieve_hybrid";
import { computeSignals } from "@/lib/controller";
import { makePlan } from "@/lib/planner";
import { preCheck, postCheck } from "@/lib/safety";
import { auditLog } from "@/lib/audit";
import { getUserModel, updateSessionSummary } from "@/lib/user_model";
import { simulateReader, shapeResponse } from "@/lib/predictive_reader";
import { computeHI } from "@/lib/hi_signals";
import { helperBudgetOk, helperShouldEngage, helperRefine } from "@/lib/helper";
import { therapyFrame } from "@/lib/therapy";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  const { message, userCriticality = 0 } = await req.json().catch(() => ({ message: "", userCriticality: 0 }));
  const userMsg = String(message ?? "").trim();
  if (!userMsg) return NextResponse.json({ error: "empty_message" }, { status: 400 });

  // --- Safety pre-check ---
  const pre = preCheck(userMsg);
  if (!pre.allow) {
    return NextResponse.json({
      error: "blocked_request",
      reasons: pre.flags.map(f=>f.id),
      safe: "I can't assist with that. If you want, I can share high-level safety information or alternatives."
    }, { status: 400 });
  }

  // --- Retrieval (Phase 10: Hybrid) ---
  const frags = fragmentsAll(600);
  await backfillEmbeddings(frags);
  const qvec = await embedOne(userMsg);

  // HYBRID retrieval (RRF over dense+BM25)
  const used = await hybridRetrieve(frags, qvec, userMsg, 6);

  // Build context lines
  const ctxLines = used.map(u => {
    const den = u?.dense ?? 0, bm = u?.bm25 ?? 0;
    return `- (hyb d:${den.toFixed(2)} bm:${bm.toFixed(2)}) ${truncate(u.text, 320)}`;
  });
  const contextBlock = ctxLines.length ? `[CONTEXT]\n${ctxLines.join("\n")}\n` : "";

  // Pull related concepts (from graph) for UI only
  const conceptMap = new Map<string, number>();
  for (const u of used) {
    const cs = conceptsForFragment(u.id);
    for (const c of cs) conceptMap.set(c.name, (conceptMap.get(c.name) || 0) + (c.weight || 1));
  }
  const relatedConcepts = [...conceptMap.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 8)
    .map(([name, weight]) => ({ name, weight }));

  // --- Therapy Frame (Phase 14) ---
  const userModel = getUserModel();
  const tf = therapyFrame(userMsg, userModel.lastSummary || "");

  // --- Compose policy surface NOW with placeholders ---
  const prelimSignals = { uncertainty: 0, novelty: 0, stability: 0, valueAtRisk: 0 };
  const systemDraft = composePolicySurface({
    taskHint: "General assistant turn with retrieved context.",
    tokenBudget: Number(process.env.POLICY_TOKEN_BUDGET ?? 1800),
    signals: prelimSignals,
    mode: undefined,
    contextBlock: ctxLines.length ? `\n[CONTEXT]\n${ctxLines.join("\n")}\n` : "",
    therapyBlock: tf.block
  });

  // --- Call model (draft) ---
  const answerDraft = await ollamaChat({
    messages: [
      { role: "system", content: systemDraft },
      { role: "user", content: userMsg }
    ],
    temperature: Number(process.env.TEMP ?? 0.7),
    top_p: Number(process.env.TOP_P ?? 0.9),
    stream: false
  });

  // --- Signals (real) ---
  const contextScores = used.map(u => u.dense || 0);
  const signals = computeSignals({
    userMsg,
    answerDraft,
    retrievalScores: contextScores,
    tokensApprox: answerDraft.length,
    userCriticality: Number(userCriticality) || 0
  });

  // --- Planner ---
  const decision = makePlan({
    msg: userMsg,
    signals,
    usedContextCount: used.length
  });

  // Prepare context bullets from 'used' retrieval
  const ctxBullets = used.map(u => `• ${u.text.slice(0, 280)}`);

  // Reasoning Helper (optional)
  let refined = answerDraft;
  let helperUsed = false;
  if (helperShouldEngage(signals) && helperBudgetOk()) {
    try {
      const { answer } = await helperRefine({
        userMsg,
        contextBullets: ctxBullets,
        localDraft: answerDraft,
        signals
      });
      refined = answer;
      helperUsed = true;
      // Prepend a marker to plan for persistence/audit (not user-visible in answer)
      if (!decision.steps.includes("reasoning_helper")) decision.steps.unshift("reasoning_helper");
    } catch (e:any) {
      // If helper fails, fall back silently to local draft
      console.warn("[CUIDADO] helper error:", e?.message || e);
    }
  }

  // --- Predictive User Response + Shaper ---
  const user = getUserModel();
  const pred = simulateReader(user, user.lastSummary || "", refined);
  const hi   = computeHI(refined, pred);
  let shapedAnswer = shapeResponse(refined, pred, hi);

  // --- Micro-steps post-shaping (Phase 14) ---
  if (tf.contract?.include_micro_steps && !/tiny step|10 min/i.test(shapedAnswer)) {
    shapedAnswer += "\n\nNext tiny step (≤10 min): pick one action you could take today and schedule it.";
  }

  // --- Safety post-check (on shaped answer) ---
  const post = postCheck(shapedAnswer, signals.valueAtRisk);
  if (!post.allow) {
    // persist a failed outcome card
    writeOutcomeCard({
      id: crypto.randomUUID(), ts: Date.now(),
      task: userMsg.slice(0,500),
      plan: decision.steps,
      outcome: "fail",
      lesson: `Blocked by safety post-check: ${post.flags.map(f=>f.id).join(",")}`,
      citations: used.map(u => u.id),
      signals
    });
    auditLog({
      ts: Date.now(),
      model: String(process.env.MODEL_PRIMARY || "unknown") + (helperUsed ? "+helper" : ""),
      userChars: userMsg.length, systemChars: systemDraft.length,
      answerChars: answerDraft.length,
      planMode: decision.mode, steps: decision.steps,
      signals: { U:signals.uncertainty, N:signals.novelty, S:signals.stability, V:signals.valueAtRisk },
      safety: ["post_block", ...post.flags.map(f=>f.id)]
    });
    return NextResponse.json({
      answer: post.transformed,
      signals,
      plan: { steps: decision.steps, mode: decision.mode },
      contextUsed: used,
      safety: post.flags,
      helper: helperUsed ? { engaged: true } : { engaged: false }
    }, { status: 400 });
  }

  const finalAnswer = post.transformed;

  // --- Persist outcome + lesson ---
  writeOutcomeCard({
    id: crypto.randomUUID(), ts: Date.now(),
    task: userMsg.slice(0,500),
    plan: decision.steps,
    outcome: "win",
    lesson: used.length ? `Used ${used.length} fragments; mode=${decision.mode}.` : `No context; mode=${decision.mode}.`,
    citations: used.map(u => u.id),
    signals
  });
  addFragment(`Lesson: mode=${decision.mode} U=${fmt(signals.uncertainty)} N=${fmt(signals.novelty)} V=${fmt(signals.valueAtRisk)}`,
    ["lesson","policy","safety"], 0.6, []);

  // Update session summary
  updateSessionSummary(`Last answer mode=${decision.mode}; EG=${hi.empathyGap.toFixed(2)}`);

  // --- Audit ---
  auditLog({
    ts: Date.now(),
    model: String(process.env.MODEL_PRIMARY || "unknown") + (helperUsed ? "+helper" : ""),
    userChars: userMsg.length, systemChars: systemDraft.length,
    answerChars: finalAnswer.length,
    planMode: decision.mode, steps: decision.steps,
    signals: { U:signals.uncertainty, N:signals.novelty, S:signals.stability, V:signals.valueAtRisk },
    safety: [...pre.flags.map(f=>f.id)]
  });

  return NextResponse.json({
    answer: finalAnswer,
    signals,
    humanSignals: {
      EG: hi.empathyGap,
      EN: hi.engagement,
      PC: hi.pace,
      AR: hi.attentionRisk
    },
    plan: { steps: decision.steps, mode: decision.mode },
    contextUsed: used,
    relatedConcepts,       // NEW
    safety: [...pre.flags.map(f=>f.id)],
    helper: helperUsed ? { engaged: true } : { engaged: false }
  });
}

// helpers
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n-1) + "…" : s; }
function fmt(x?: number) { return typeof x === "number" ? x.toFixed(2) : ""; }
function normalizeLex(x: number) {
  // naive mapping: overlap counts (0..?) → ~0..1 scale
  return Math.max(0, Math.min(1, x / 8));
}
