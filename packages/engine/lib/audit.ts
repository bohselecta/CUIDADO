export type AuditRow = {
  ts: number;
  model: string;
  userChars: number;
  systemChars: number;
  answerChars: number;
  planMode: "fast"|"thoughtful";
  steps: string[];
  signals: { U:number; N:number; S:number; V:number };
  safety: string[]; // list of flag ids
};

export function auditLog(row: AuditRow) {
  const line = `[CUIDADO][AUDIT] ts=${row.ts} model=${row.model} user=${row.userChars} sys=${row.systemChars} ans=${row.answerChars} mode=${row.planMode} steps=${row.steps.join(">")} U=${row.signals.U.toFixed(2)} N=${row.signals.N.toFixed(2)} S=${row.signals.S.toFixed(2)} V=${row.signals.V.toFixed(2)} safety=[${row.safety.join(",")}]`;
  // console output is our invariant for Phase 6
  console.log(line);
}
