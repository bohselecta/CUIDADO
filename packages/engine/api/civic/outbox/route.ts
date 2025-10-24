import { NextResponse } from "next/server";
import { getCivicOutbox } from "../../../../src/lib/memory";

export async function GET() {
  try {
    const items = getCivicOutbox();
    return NextResponse.json({ items, nextCursor: null });
  } catch (error) {
    console.error("[CIVIC] Error fetching outbox:", error);
    return NextResponse.json({ items: [], nextCursor: null });
  }
}
