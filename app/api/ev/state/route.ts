import { NextResponse } from "next/server";
import { getEVFeatures } from "@/lib/env_voice";

export async function GET() {
  return NextResponse.json(getEVFeatures());
}
