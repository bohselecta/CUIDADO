import { NextResponse } from "next/server";
import { getCivicMood } from "../../../../src/lib/memory";

export async function GET() {
  try {
    const mood = getCivicMood();
    
    return NextResponse.json({
      window: "1h",
      U: mood?.uncertainty || 0.31,
      N: mood?.novelty || 0.44,
      S: mood?.stability || 0.62,
      V: mood?.valueAtRisk || 0.12,
      sample: mood?.sample || 0
    });
  } catch (error) {
    console.error("[CIVIC] Error fetching mood:", error);
    return NextResponse.json({
      window: "1h",
      U: 0.31,
      N: 0.44,
      S: 0.62,
      V: 0.12,
      sample: 0
    });
  }
}
