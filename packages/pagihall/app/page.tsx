"use client";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-tuscan-dusk text-white">
      <div className="relative">
        <Image src="/pagihall-exterior.jpg" alt="Pagi Hall" width={1920} height={1080}
               className="w-full h-[70vh] object-cover brightness-[.85]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-tuscan-dusk/70 to-transparent"/>
        <div className="absolute inset-x-0 bottom-8 px-6 md:px-12">
          <h1 className="text-4xl md:text-6xl font-semibold">Pagi Hall</h1>
          <p className="max-w-2xl mt-3 text-sm md:text-base opacity-90">
            A quiet internet inside a villa — where your digital cloak speaks for you and to you.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/cloak" className="bg-white text-black px-4 py-2 rounded-lg">Enter the Hall</Link>
            <Link href="/briefs" className="border border-white/30 px-4 py-2 rounded-lg">Read Civic Briefs</Link>
          </div>
        </div>
      </div>

      <section className="px-6 md:px-12 py-12 grid md:grid-cols-3 gap-6 bg-gradient-to-b from-tuscan-dusk to-black">
        {[
          ["Think with others","Your personal AI (the Cloak) joins a living hall of ideas."],
          ["Topic of the moment","The room orients around a live issue from world & US news."],
          ["Leave with clarity","Every visit ends with a small insight, not a feed."],
        ].map(([h,b])=>(
          <div key={h} className="bg-black/30 border border-white/10 p-5 rounded-xl">
            <div className="text-lg font-medium">{h}</div>
            <p className="text-sm opacity-80 mt-2">{b}</p>
          </div>
        ))}
      </section>

      <footer className="bg-tuscan-dusk text-white text-center py-6 text-sm opacity-70">
        Powered by <a href="/cuidado" className="underline hover:text-tuscan-sand transition-colors">CUIDADO Engine</a> — An open conversational framework for local AGI.
      </footer>
    </main>
  );
}