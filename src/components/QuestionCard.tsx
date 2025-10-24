import React from "react";

export function QuestionCard({ q }:{ q:any }) {
  return (
    <div className="bg-neutral-900 rounded p-3">
      <div className="text-sm font-semibold">{q.intent}</div>
      <div className="text-xs opacity-75">{q.content}</div>
      <div className="text-[10px] opacity-60 mt-1">{(q.principles||[]).join(", ")}</div>
    </div>
  );
}
