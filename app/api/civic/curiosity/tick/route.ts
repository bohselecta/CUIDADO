import { NextResponse } from "next/server";
import { curiosityTick } from "../../../../../src/lib/questions";

export async function POST() {
  try {
    // Run curiosity engine; generate 0..n questions into outbox
    const generated = await curiosityTick();
    
    return NextResponse.json({ 
      ok: true, 
      generated: generated || 0 
    });
  } catch (error) {
    console.error("[CIVIC] Error in curiosity tick:", error);
    return NextResponse.json({ 
      ok: true, 
      generated: 0,
      error: "tick_failed" 
    });
  }
}
