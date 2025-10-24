import React from "react";

export function MoodViz({ mood }:{ mood: { U:number; N:number; S:number; V:number }|null }) {
  if (!mood) return <div className="text-xs opacity-60">No data</div>;
  
  const bars = [
    ["Uncertainty", mood.U],
    ["Novelty", mood.N],
    ["Stability", mood.S],
    ["Value@Risk", mood.V],
  ] as const;
  
  return (
    <div className="space-y-1">
      {bars.map(([k,v]) => (
        <div key={k} className="text-xs">
          <div className="opacity-70">{k}</div>
          <div className="h-2 bg-neutral-800 rounded">
            <div 
              className="h-2 bg-white rounded" 
              style={{ width: `${Math.round((v||0)*100)}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}
