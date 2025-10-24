import { NextRequest, NextResponse } from "next/server";
import { getTherapyMode, setTherapyMode } from "@/lib/therapy";

export async function GET() {
  return NextResponse.json({ mode: getTherapyMode() });
}

export async function POST(req: NextRequest) {
  const { mode } = await req.json().catch(()=>({ mode: "off" }));
  const m = String(mode || "off").toLowerCase();
  const allowed = ["off","gottman","frankl","cbt","existential"];
  if (!allowed.includes(m)) return NextResponse.json({ ok:false, error:"invalid_mode" }, { status: 400 });
  setTherapyMode(m as any);
  return NextResponse.json({ ok:true, mode: m });
}
