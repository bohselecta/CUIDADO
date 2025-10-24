"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user"|"assistant"|"system"; content: string };

export default function ChatUIStream() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "system", content: "CUIDADO (streaming) — ask me anything." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;

    setError(null); 
    setSignals(null);
    const userMsg: Msg = { role: "user", content: input };
    const payload = messages.filter(m => m.role !== "system").concat(userMsg);

    setMessages(m => [...m, userMsg, { role: "assistant", content: "" }]);
    setInput(""); 
    setBusy(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        setError("Model stream unavailable.");
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        setMessages(prev => {
          const next = [...prev];
          const i = next.length - 1;
          next[i] = { ...next[i], content: next[i].content + chunk };
          return next;
        });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") setError("Streaming error (retry ok).");
    } finally {
      setBusy(false);
      abortRef.current = null;
      // Fetch debug (signals + system prompt excerpt)
      fetch("/api/chat/stream")
        .then(r=>r.json())
        .then(j => { setSignals(j?.signals || null); setSystemPrompt(j?.systemPrompt || null); })
        .catch(()=>{});
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }

  return (
    <div className="grid h-[calc(100vh-140px)] grid-rows-[auto_auto_1fr_auto] bg-black text-white rounded-xl border border-white/10">
      <div className="p-3 flex items-center gap-3 border-b border-white/10">
        <div className="text-sm font-semibold">CUIDADO Assistant (Streaming)</div>
        {busy && <span className="text-xs opacity-70">typing…</span>}
        {!!error && <span className="text-xs text-red-400">{error}</span>}
        <div className="ml-auto flex gap-2">
          <button onClick={()=>setShowPrompt(v=>!v)} className="text-xs border border-white/20 px-2 py-1 rounded">
            {showPrompt ? "Hide system prompt" : "View system prompt"}
          </button>
          {busy && <button onClick={stop} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">⏹ Stop</button>}
        </div>
      </div>

      {/* signals */}
      <div className="px-3 py-2 text-xs border-b border-white/10 flex gap-4">
        {signals ? (
          <>
            <Meter label="U" v={signals.U}/>
            <Meter label="N" v={signals.N}/>
            <Meter label="S" v={signals.S}/>
            <Meter label="V" v={signals.V}/>
          </>
        ) : <span className="opacity-50">Signals will appear after a reply.</span>}
      </div>

      {/* messages */}
      <div ref={scroller} className="overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={
            m.role === "user" ? "ml-auto max-w-[80%] bg-white text-black rounded-lg px-3 py-2"
            : m.role === "assistant" ? "max-w-[80%] bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 whitespace-pre-wrap"
            : "text-xs opacity-70"
          }>
            {m.content || (i === messages.length-1 && busy ? "…" : "")}
          </div>
        ))}
      </div>

      {/* input */}
      <form onSubmit={send} className="flex gap-2 p-3 border-t border-white/10">
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          placeholder="Ask anything…"
          className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 outline-none"
        />
        <button disabled={busy || !input.trim()} className="bg-white text-black px-4 py-2 rounded-lg disabled:opacity-50">
          {busy ? "Thinking…" : "Send"}
        </button>
      </form>

      {/* prompt drawer */}
      {showPrompt && (
        <div className="p-3 text-xs bg-neutral-950 border-t border-white/10 max-h-56 overflow-auto">
          <div className="opacity-60 mb-1">System prompt (excerpt)</div>
          <pre className="whitespace-pre-wrap">{systemPrompt || "No prompt available."}</pre>
        </div>
      )}
    </div>
  );
}

function Meter({ label, v }: { label:string; v:number }) {
  const pct = Math.max(0, Math.min(1, Number(v||0))) * 100;
  return (
    <div className="flex items-center gap-1">
      <span className="opacity-70">{label}</span>
      <div className="w-24 h-2 bg-neutral-800 rounded overflow-hidden">
        <div 
          className="h-2 bg-white rounded transition-all duration-200" 
          style={{ 
            width: `${pct}%`,
            transform: `translateX(${pct > 0 ? '0' : '-100%'})`
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
