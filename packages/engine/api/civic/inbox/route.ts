import { NextResponse } from "next/server";
import { getCivicInbox } from "../../../../src/lib/memory";

export async function GET() {
  try {
    const items = getCivicInbox();
    return NextResponse.json({ items, nextCursor: null });
  } catch (error) {
    console.error("[CIVIC] Error fetching inbox:", error);
    return NextResponse.json({ items: [], nextCursor: null });
  }
}
