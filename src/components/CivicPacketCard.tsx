import React from "react";

export function CivicPacketCard({ pkt }:{ pkt:any }) {
  return (
    <div className="bg-neutral-900 rounded p-3">
      <div className="text-sm font-semibold">{pkt.type} — {pkt.intent}</div>
      <div className="text-xs opacity-75">{pkt.content}</div>
      <div className="text-[10px] opacity-60 mt-1">from: {pkt.from} | {pkt.timestamp}</div>
    </div>
  );
}
