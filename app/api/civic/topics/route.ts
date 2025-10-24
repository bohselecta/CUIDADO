import { NextRequest, NextResponse } from "next/server";

// In-memory topic store for Phase 15.5
let TOPICS = [
  { key: "open_models", color: "#60a5fa", label: "Open Models" },
  { key: "privacy", color: "#f59e0b", label: "Privacy" },
  { key: "safety", color: "#ef4444", label: "Safety" },
  { key: "education", color: "#10b981", label: "Education" },
  { key: "governance", color: "#a78bfa", label: "Governance" },
];

let ACTIVE_TOPIC = TOPICS[0].key;

export async function GET() {
  return NextResponse.json({ 
    topics: TOPICS, 
    active: ACTIVE_TOPIC 
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Update topics if provided
    if (Array.isArray(body.topics) && body.topics.length > 0) {
      TOPICS = body.topics;
    }
    
    // Update active topic if provided and valid
    if (body.active && TOPICS.find(t => t.key === body.active)) {
      ACTIVE_TOPIC = body.active;
    }
    
    return NextResponse.json({ 
      ok: true, 
      topics: TOPICS, 
      active: ACTIVE_TOPIC 
    });
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: "Invalid request body" 
    }, { status: 400 });
  }
}
