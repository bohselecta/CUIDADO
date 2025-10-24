"use client";
import React, { useEffect, useState } from "react";

export default function CivicDashboard() {
  const [inbox, setInbox] = useState<any[]>([]);
  const [outbox, setOutbox] = useState<any[]>([]);
  const [mood, setMood] = useState<any>(null);

  async function refresh() {
    const [ib, ob, md] = await Promise.all([
      fetch("/api/civic/inbox").then(r=>r.json()),
      fetch("/api/civic/outbox").then(r=>r.json()),
      fetch("/api/civic/mood").then(r=>r.json())
    ]);
    setInbox(ib.items || []); 
    setOutbox(ob.items || []); 
    setMood(md || null);
  }
  
  useEffect(()=>{ refresh(); },[]);

  async function createQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      intent: fd.get("intent"),
      content: fd.get("content"),
      principles: (fd.get("principles") as string)?.split(",").map(s=>s.trim()).filter(Boolean) || [],
      tags: (fd.get("tags") as string)?.split(",").map(s=>s.trim()).filter(Boolean) || []
    };
    await fetch("/api/civic/questions", { 
      method:"POST", 
      headers:{ "Content-Type":"application/json" }, 
      body: JSON.stringify(payload) 
    });
    (e.target as any).reset();
    refresh();
  }

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-2xl font-bold">Civic Dashboard</h1>
      
      <section className="grid gap-4 md:grid-cols-3">
        <Card title="Mood">
          <pre className="text-xs opacity-80">{JSON.stringify(mood, null, 2)}</pre>
        </Card>
        
        <Card title="New Question">
          <form onSubmit={createQuestion} className="space-y-2">
            <input 
              name="intent" 
              placeholder="intent (e.g., clarify_value_conflict)" 
              className="w-full bg-neutral-900 p-2 rounded" 
            />
            <input 
              name="principles" 
              placeholder="principles (comma-separated)" 
              className="w-full bg-neutral-900 p-2 rounded" 
            />
            <input 
              name="tags" 
              placeholder="tags (comma-separated)" 
              className="w-full bg-neutral-900 p-2 rounded" 
            />
            <textarea 
              name="content" 
              placeholder="question content..." 
              className="w-full bg-neutral-900 p-2 rounded h-24" 
            />
            <button className="bg-blue-600 px-3 py-1 rounded text-sm">Create</button>
          </form>
        </Card>
        
        <Card title="Actions">
          <div className="flex gap-2">
            <button 
              className="bg-neutral-800 px-3 py-1 rounded text-sm" 
              onClick={()=>fetch("/api/civic/curiosity/tick", { method:"POST" }).then(()=>refresh())}
            >
              Curiosity Tick
            </button>
            <button 
              className="bg-neutral-800 px-3 py-1 rounded text-sm" 
              onClick={refresh}
            >
              Refresh
            </button>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title={`Inbox (${inbox.length})`}>
          <List items={inbox} empty="No incoming packets yet." />
        </Card>
        <Card title={`Outbox (${outbox.length})`}>
          <List items={outbox} empty="No outbox items yet." />
        </Card>
      </section>
    </div>
  );
}

function Card({ title, children }:{ title:string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4">
      <div className="text-lg font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function List({ items, empty }:{ items:any[]; empty:string }) {
  if (!items?.length) return <div className="text-sm opacity-60">{empty}</div>;
  return (
    <ul className="space-y-2">
      {items.map((it:any) => (
        <li key={it.id} className="bg-neutral-900 rounded p-3">
          <div className="text-sm font-semibold">{it.type}: {it.intent}</div>
          <div className="text-xs opacity-70">{it.content}</div>
          <div className="text-[10px] opacity-60 mt-1">{it.principles?.join(", ")}</div>
        </li>
      ))}
    </ul>
  );
}
