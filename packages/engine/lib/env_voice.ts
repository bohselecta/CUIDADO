export type EVFeatures = {
  hasVoice: boolean;     // mic permission (simulated)
  speaking: boolean;     // user currently speaking (mock)
  speechRate?: number;   // words/sec (mock)
  pitchMean?: number;    // 0..1 normalized (mock)
  energyMean?: number;   // 0..1 normalized (mock)
  movement?: "stationary"|"walking"|"driving"|"unknown";
  distraction?: "low"|"medium"|"high";
};

let feat: EVFeatures = { hasVoice:false, speaking:false, movement:"unknown", distraction:"low", energyMean:0.4 };

export function setEVFeatures(f: Partial<EVFeatures>) { feat = { ...feat, ...f }; }
export function getEVFeatures(): EVFeatures { return feat; }

/**
 * Compute UI-relevant signals from EV features.
 * EN: engagement (attention to the agent)
 * PC: pace (brevity preference; 1 = wants short & quick)
 * AROUSAL: arousal from energy & movement
 */
export function computeInterfaceSignals(): { EN:number; PC:number; AROUSAL:number } {
  const m = feat.movement ?? "unknown";
  const energy = clamp01(feat.energyMean ?? 0.4);
  const speaking = feat.speaking ? 1 : 0;
  const distract = feat.distraction === "high" ? 0.3 : feat.distraction === "medium" ? 0.55 : 0.8;

  // Pace: user wants shorter outputs when moving / speaking / high energy
  let PC = 0.4;
  if (m === "walking") PC += 0.35;
  if (m === "driving") PC += 0.45;
  PC += (speaking * 0.15);
  PC += (energy - 0.4) * 0.4;
  PC = clamp01(PC);

  // Engagement: drop with distraction, rise if speaking
  let EN = 0.6 * distract + speaking * 0.25;
  EN = clamp01(EN);

  // Arousal from energy + movement
  let AROUSAL = clamp01(0.5 * energy + (m === "walking" ? 0.2 : m === "driving" ? 0.35 : 0));

  return { EN, PC, AROUSAL };
}

const clamp01 = (x:number)=>Math.max(0,Math.min(1,x));
