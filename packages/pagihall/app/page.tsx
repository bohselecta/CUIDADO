"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import OnboardingModal from "@/src/components/OnboardingModal";
import OfflineNotice from "@/src/components/OfflineNotice";

export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  const [ollamaUp, setOllamaUp] = useState<boolean | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem("ph.onboarded");
    setShowIntro(!seen);
    // simple Ollama check (ok to fail silently on Vercel)
    fetch("http://127.0.0.1:11434/api/tags", { method: "GET" })
      .then(() => setOllamaUp(true))
      .catch(() => setOllamaUp(false));
  }, []);

  function dismissIntro() {
    localStorage.setItem("ph.onboarded", "1");
    setShowIntro(false);
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* HERO */}
      <section className="relative">
        <Image
          src="/pagihall-exterior.jpg"
          alt="Pagi Hall"
          width={1920}
          height={1080}
          className="w-full h-[68vh] md:h-[72vh] object-cover brightness-[.9]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/85 via-[var(--bg)]/20 to-transparent" />
        <div className="absolute bottom-8 left-6 md:left-12 right-6 text-[var(--text)]">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Pagi Hall</h1>
          <p className="max-w-2xl mt-3 text-sm md:text-base opacity-85">
            A quiet internet inside a villa — where your digital cloak listens, speaks, and learns alongside you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/cloak" className="btn-accent">Enter the Hall</Link>
            <Link href="/cuidado" className="text-sm border border-[var(--line)] rounded-[12px] px-3 py-2 hover:bg-[var(--accent-soft)]">
              Powered by CUIDADO Engine
            </Link>
          </div>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section className="px-6 md:px-12 py-10 grid md:grid-cols-3 gap-6">
        {[
          ["Think clearly", "Your cloak turns headlines into decisions you can live with."],
          ["See the room", "Watch personal AIs cluster and connect around a live topic."],
          ["Leave wiser", "Each visit ends with a small brief, not an infinite feed."]
        ].map(([h,b])=>(
          <div key={h} className="bg-[var(--bg-soft)] border border-[var(--line)] rounded-2xl p-5">
            <div className="text-lg font-medium">{h}</div>
            <p className="text-sm opacity-80 mt-2">{b}</p>
          </div>
        ))}
      </section>

      {/* PREVIEW → HALL */}
      <section className="px-6 md:px-12 pb-12">
        <div className="rounded-2xl border border-[var(--line)] overflow-hidden shadow-[var(--shadow)]">
          <div className="px-5 py-3 border-b border-[var(--line)] bg-gradient-to-r from-[var(--accent-soft)]/40 to-transparent">
            <div className="text-sm opacity-85">Today's Civic Topic rotates with the news</div>
          </div>
          <div className="p-0 md:p-3 bg-black">
            <iframe
              src="/civic/hall"
              title="Pagi Hall Preview"
              className="w-full h-[420px] rounded-none md:rounded-xl border-0"
            />
          </div>
          <div className="px-5 py-4 flex flex-wrap gap-3 items-center bg-[var(--bg-soft)] border-t border-[var(--line)]">
            <Link href="/civic/hall" className="btn-accent">Open full Hall</Link>
            <span className="text-xs opacity-70">Live simulation • Privacy-first</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-xs opacity-70 text-center py-8 border-t border-[var(--line)]">
        Powered by <Link href="/cuidado" className="underline">CUIDADO Engine</Link>
      </footer>

      {/* ONBOARDING + OFFLINE */}
      {showIntro && <OnboardingModal onClose={dismissIntro} />}
      {ollamaUp === false && <OfflineNotice />}
    </main>
  );
}