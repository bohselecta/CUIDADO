"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export default function Cloak() {
  const r = useRouter();
  const [tone, setTone] = useState("reflective");

  async function begin() {
    // store simple cloak prefs locally; backend already has persona/constitution
    localStorage.setItem("cloak.tone", tone);
    r.push("/civic/hall");
  }

  return (
    <div className="min-h-screen bg-tuscan-dusk text-white grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <Image src="/pagihall-interior.jpg" alt="Hall interior" width={1200} height={1200}
               className="w-full h-full object-cover brightness-[.9]" />
        <div className="absolute inset-0 bg-gradient-to-r from-tuscan-dusk/50 to-transparent"/>
      </div>
      <div className="p-8 flex flex-col justify-center gap-6">
        <h1 className="text-3xl font-semibold">Fasten the Cloak</h1>
        <p className="opacity-85 text-sm">Your cloak listens as you type and speaks back in thought through the chat.</p>
        <label className="text-sm opacity-80">Choose a tone</label>
        <select value={tone} onChange={e=>setTone(e.target.value)}
                className="bg-black/40 border border-white/15 p-2 rounded">
          <option value="reflective">Reflective</option>
          <option value="curious">Curious</option>
          <option value="practical">Practical</option>
        </select>
        <button onClick={begin} className="bg-white text-black px-4 py-2 rounded-lg w-fit">Enter Pagi Hall</button>
        <p className="text-xs opacity-70">No audio yet — the cloak speaks silently in your head via the chat.</p>
      </div>
    </div>
  );
}
