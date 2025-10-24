import { NextRequest, NextResponse } from "next/server";
import { fragmentsAll } from "@/lib/memory";
import { bm25TopK } from "@/lib/retrieval";
import crypto from "node:crypto";

export async function POST(req: NextRequest, { params }: { params: { name: string } }) {
  const { name } = params;
  const body = await req.json().catch(() => ({}));
  
  try {
    if (name === "now") {
      const result = new Date().toISOString();
      return NextResponse.json({ ok: true, result });
    }
    
    if (name === "uuid") {
      const result = crypto.randomUUID();
      return NextResponse.json({ ok: true, result });
    }
    
    if (name === "sum") {
      const nums = body.nums || [];
      if (!Array.isArray(nums) || nums.length === 0) {
        return NextResponse.json({ ok: false, error: "nums array required with at least one number" });
      }
      const result = nums.reduce((a, b) => a + b, 0);
      return NextResponse.json({ ok: true, result });
    }
    
    if (name === "searchLessons") {
      const query = body.query || "";
      const k = body.k || 5;
      if (!query) {
        return NextResponse.json({ ok: false, error: "query string required" });
      }
      const frags = fragmentsAll(300);
      const hits = bm25TopK(frags, query, k);
      const result = hits.map(h => ({
        id: h.id,
        ts: frags.find(f => f.id === h.id)?.ts || 0,
        text: h.text,
        tags: h.tags,
        score: h.score
      }));
      return NextResponse.json({ ok: true, result });
    }
    
    return NextResponse.json({ ok: false, error: "unknown tool" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
