import { NextResponse } from "next/server";

// simple mapping; expand later
const TOPICS = [
  { key: "open_models", color: "#60a5fa", label: "Open Models" },
  { key: "privacy",     color: "#f59e0b", label: "Privacy" },
  { key: "safety",      color: "#ef4444", label: "Safety" },
  { key: "education",   color: "#10b981", label: "Education" },
  { key: "governance",  color: "#a78bfa", label: "Governance" },
];

let ACTIVE = TOPICS[0].key;
let LAST = { headlines: [] as string[], at: 0 };

function decideActiveFrom(headlines: string[]) {
  const joined = headlines.join(" ").toLowerCase();
  const votes: Record<string, number> = {
    open_models: /open|model|ai|llm|open-source/.test(joined) ? 1 : 0,
    privacy: /privacy|data|surveillance|tracking/.test(joined) ? 1 : 0,
    safety: /safety|risk|harm|security|attack|breach/.test(joined) ? 1 : 0,
    education: /school|learning|students|university|education/.test(joined) ? 1 : 0,
  };
  let best = "governance", score = 0;
  for (const [k,v] of Object.entries(votes)) if (v>score) { best = k; score = v; }
  ACTIVE = best;
}

export async function GET() {
  return NextResponse.json({ topics: TOPICS, active: ACTIVE, headlines: LAST.headlines, refreshedAt: LAST.at });
}

// Called by cron to refresh
export async function POST() {
  try {
    const sources = [
      "https://www.reddit.com/r/worldnews.json?limit=5",
      "https://www.reddit.com/r/news.json?limit=5",
      "https://www.reddit.com/r/technology.json?limit=5",
    ];
    const all = await Promise.all(sources.map(u => fetch(u, { next: { revalidate: 60 }}).then(r=>r.json())));
    const titles = all.flatMap((j:any)=> (j?.data?.children||[]).map((p:any)=> String(p.data?.title||"").trim()).filter(Boolean));
    if (titles.length) { LAST = { headlines: titles.slice(0,12), at: Date.now() }; decideActiveFrom(titles); }
    return NextResponse.json({ ok:true, active: ACTIVE, count: titles.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 500 });
  }
}
