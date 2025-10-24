import { NextRequest, NextResponse } from "next/server";
import { embedTexts } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  const { input } = await req.json().catch(()=>({ input: [] }));
  if (!Array.isArray(input) || input.length === 0) return NextResponse.json([], { status: 200 });
  const vecs = await embedTexts(input);
  return NextResponse.json(vecs);
}
