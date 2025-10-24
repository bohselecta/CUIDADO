"use client";

export default function OfflineNotice() {
  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm bg-[var(--bg-soft)] border border-[var(--line)] rounded-xl p-3 shadow-[var(--shadow)]">
      <div className="text-sm font-medium">Local model not detected</div>
      <p className="text-xs opacity-75 mt-1">
        Pagi Hall runs best with a local model via <span className="font-semibold">Ollama</span>. You can still explore the Hall; set up the engine later.
      </p>
      <div className="flex gap-2 mt-3">
        <a className="text-xs border border-[var(--line)] rounded-[10px] px-3 py-1 hover:bg-[var(--accent-soft)]" href="/cuidado/download">Get CUIDADO</a>
        <a className="text-xs border border-[var(--line)] rounded-[10px] px-3 py-1 hover:bg-[var(--accent-soft)]" href="https://ollama.com" target="_blank" rel="noopener noreferrer">Install Ollama</a>
      </div>
    </div>
  );
}
