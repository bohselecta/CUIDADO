import { NextResponse } from "next/server";
import { fragmentsAll, mineConceptsForFragment } from "@/lib/memory";

export async function POST() {
  const all = fragmentsAll(1000);
  all.forEach(f => mineConceptsForFragment(f));
  return NextResponse.json({ ok: true, fragments: all.length });
}
