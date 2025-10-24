"use client";
import Link from "next/link";

export default function CuidadoHome() {
  return (
    <main className="min-h-screen bg-cuidado-gradient text-cuidado-white p-8 md:p-16 space-y-8">
      <section className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <img 
            src="/cuidado-logo-graphic-mark.svg" 
            alt="CUIDADO" 
            className="w-16 h-16 logo-mark"
          />
          <h1 className="text-5xl font-bold tracking-tight font-display">CUIDADO Engine</h1>
        </div>
        <p className="text-cuidado-bronze text-lg">
          The conversational framework that powers Pagi Hall.  
          CUIDADO lets any developer build a local AI assistant that learns through behavior — not just tokens.
        </p>
        <div className="flex gap-3 mt-6">
          <Link href="/cuidado/chat" className="bg-cuidado-white text-cuidado-obsidian px-4 py-2 rounded hover:shadow-glow transition-all duration-smooth">Try the Assistant</Link>
          <Link href="/cuidado/docs" className="border border-cuidado-white/30 px-4 py-2 rounded hover:border-cuidado-teal transition-all duration-smooth">Read the Docs</Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 pt-12 border-t border-cuidado-white/10">
        {[
          ["Behavioral Intelligence","CUIDADO doesn't just complete text — it learns from your feedback, emotions, and outcomes, building an evolving sense of care."],
          ["Local First","Runs entirely on your machine via Ollama or GPU acceleration. Your thoughts, your data, your control."],
          ["Modular Ethics","Every instance runs from editable YAML constitutions, personas, and tone models — so alignment becomes transparent."],
        ].map(([h,b])=>(
          <div key={h} className="bg-cuidado-iron/30 border border-cuidado-white/10 p-5 rounded-xl hover:border-cuidado-bronze/30 transition-all duration-smooth">
            <h3 className="font-semibold text-cuidado-bronze mb-2">{h}</h3>
            <p className="text-sm opacity-80">{b}</p>
          </div>
        ))}
      </section>

      <section className="max-w-3xl mx-auto pt-12 border-t border-cuidado-white/10">
        <h2 className="text-2xl font-semibold mb-3 font-display">Why CUIDADO?</h2>
        <p className="text-sm opacity-80 leading-relaxed">
          Because intelligence isn't just answers — it's alignment, memory, and civic participation.  
          The CUIDADO engine was built to be embedded in communities, applications, and creative workflows where AI serves as a true partner.
        </p>
      </section>

      <section className="max-w-3xl mx-auto text-center space-y-3 pt-12 border-t border-cuidado-white/10">
        <h2 className="text-2xl font-semibold font-display">Download the Engine</h2>
        <p className="text-sm opacity-80">Run it locally or fork on GitHub.</p>
        <div className="flex justify-center gap-3 mt-4">
          <a href="https://github.com/pagihall/cuidado" className="bg-cuidado-white text-cuidado-obsidian px-4 py-2 rounded hover:shadow-deep transition-all duration-smooth">GitHub</a>
          <a href="https://ollama.com" className="border border-cuidado-white/30 px-4 py-2 rounded hover:border-cuidado-teal transition-all duration-smooth">Ollama</a>
        </div>
      </section>

      <footer className="text-xs opacity-60 tracking-wide uppercase text-center pt-8">
        Part of the Pagi Hall ecosystem
      </footer>
    </main>
  );
}
