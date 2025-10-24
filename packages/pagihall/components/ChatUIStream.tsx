"use client";
import { useEffect, useRef, useState } from "react";
import Formatted from "@/src/components/Formatted";
import MeterPill from "@/src/components/MeterPill";
import PaletteSwitch from "@/src/components/PaletteSwitch";

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
        .then(j => { 
          console.log("Debug data:", j);
          setSignals(j?.signals || null); 
          setSystemPrompt(j?.systemPrompt || null); 
        })
        .catch(e => console.error("Debug fetch error:", e));
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }

  return (
    <>
      {/* Header */}
      <div className="chat-header">
        <div className="header-title">CUIDADO Assistant (Streaming)</div>
        {busy && <span className="header-sub">typing…</span>}
        {!!error && <span className="header-sub" style={{ color: "#ef4444" }}>{error}</span>}
        <div style={{ marginLeft: "auto" }} />
        <button
          onClick={() => setShowPrompt(v => !v)}
          className="text-xs border border-[var(--accent-line)] rounded-[12px] px-3 py-1 hover:bg-[var(--accent-soft)]"
        >
          {showPrompt ? "Hide system prompt" : "View system prompt"}
        </button>
        {busy && (
          <button onClick={stop} className="ml-2 text-xs bg-[var(--text)] text-black rounded-[12px] px-3 py-1">
            Stop
          </button>
        )}
        <PaletteSwitch className="ml-2" />
      </div>

      {/* Toolbar with meters */}
      <div className="chat-toolbar">
        <div className="meters">
          {signals ? (
            <>
              <MeterPill label="Understanding" v={signals.U} />
              <MeterPill label="Novelty" v={signals.N} />
              <MeterPill label="Safety" v={signals.S} />
              <MeterPill label="Valence" v={signals.V} />
            </>
          ) : (
            <span className="header-sub">Signals appear after a reply.</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scroller} className="chat-scroll">
        <div className="thread">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "bubble user"
                  : m.role === "assistant"
                  ? "bubble assistant"
                  : "bubble meta"
              }
            >
              {m.role === "assistant" ? (
                <Formatted raw={m.content} />
              ) : (
                m.content || (i === messages.length - 1 && busy ? "…" : "")
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={send} className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything…"
        />
        <button
          disabled={busy || !input.trim()}
          className={`btn-accent disabled:opacity-50 ${busy ? "opacity-90" : ""}`}
        >
          {busy ? "Thinking…" : "Send"}
        </button>
      </form>

      {/* Prompt drawer */}
      {showPrompt && (
        <div className="p-3 text-xs border-t border-[var(--line)] bg-[var(--bg)]" style={{ maxHeight: 220, overflow: "auto" }}>
          <div className="opacity-60 mb-1">System prompt (excerpt)</div>
          <pre className="cuidado-prose whitespace-pre-wrap">{systemPrompt || "No prompt available."}</pre>
        </div>
      )}
    </>
  );
}

