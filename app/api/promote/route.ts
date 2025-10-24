import { NextRequest, NextResponse } from "next/server";
import { proposePromotions, applyPromotion } from "@/lib/concept_store";

export async function GET() {
  const candidates = proposePromotions(120);
  return NextResponse.json({
    candidates: candidates.map(c => ({
      id: c.id,
      title: c.title,
      reason: c.reason,
      diff: c.diffPreview
    }))
  });
}

export async function POST(req: NextRequest) {
  const { id } = await req.json().catch(()=>({ id: "" }));
  if (!id) return NextResponse.json({ applied: false, error: "missing_id" }, { status: 400 });

  const res = applyPromotion(id);
  if (!res.applied) return NextResponse.json({ applied: false, error: "not_found" }, { status: 404 });

  return NextResponse.json({ applied: true, backup: res.backupPath });
}
