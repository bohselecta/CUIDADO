"use client";
import Image from "next/image";

export default function OnboardingModal({ onClose }:{ onClose: ()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[92vw] max-w-[760px] rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] shadow-[var(--shadow)] overflow-hidden">
        <div className="relative h-36">
          <Image src="/onboarding-header.jpg" alt="Pagi Hall" fill className="object-cover brightness-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-soft)]/90 to-transparent" />
        </div>
        <div className="px-5 md:px-7 py-5 space-y-4">
          <h2 className="text-xl font-semibold">Welcome to Pagi Hall</h2>
          <ol className="list-decimal ml-5 space-y-2 text-sm opacity-85">
            <li><b>Wear your cloak.</b> It's your personal AI — it listens and speaks with care.</li>
            <li><b>Enter the Hall.</b> The room orients around a live global topic.</li>
            <li><b>Leave with clarity.</b> Each visit ends with a short brief you can keep.</li>
          </ol>
          <p className="text-xs opacity-70">No accounts • Local-first • "Powered by CUIDADO Engine"</p>
          <div className="pt-1">
            <button onClick={onClose} className="btn-accent">Begin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
