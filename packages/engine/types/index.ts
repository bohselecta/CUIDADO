export type ControlSignals = {
  uncertainty:number;  // U  (0..1)
  novelty:number;      // N
  stability:number;    // S
  valueAtRisk:number;  // V
};

export type PlannerDecision = { mode: "fast" | "thoughtful"; steps: string[]; rationale?: string };
export type Plan = { steps: string[]; mode?: "fast"|"thoughtful" };

export type Fragment = {
  id: string;
  ts: number;
  text: string;
  tags: string[];
  source?: string;
  trust?: number;
  emb?: number[]; // reserved for Phase 4
};

export type OutcomeCard = {
  id: string;
  ts: number;
  task: string;
  plan: string[];
  outcome: "win" | "fail";
  lesson: string;
  citations?: string[];
  signals?: Partial<ControlSignals>;
};

export type UserModel = {
  id: string;
  traits: string[];     // e.g., ["direct","builder"]
  values: string[];     // e.g., ["clarity","craft","speed"]
  goals: string[];      // e.g., ["ship usable things"]
  stylePrefs: string[]; // e.g., ["bullets","code-first","no-fluff"]
  lastSummary?: string;
};

export type PredictedUserState = {
  cognition: string[];      // likely thoughts/needs
  affect: { valence: number; arousal: number; label: string };
  desiredOutcome: string[]; // e.g., ["clear next steps"]
  toneAdvice: string[];     // e.g., ["bullet-forward","direct"]
};

export type HInterfaceSignals = {
  empathyGap: number;   // EG 0..1
  engagement: number;   // EN 0..1
  pace: number;         // PC 0..1 (1=fast/brief)
  attentionRisk: number;// AR 0..1
};
