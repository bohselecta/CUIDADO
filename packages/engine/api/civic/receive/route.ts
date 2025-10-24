import { NextRequest, NextResponse } from "next/server";
import { saveCivicPacket } from "../../../../src/lib/memory";

export async function POST(req: NextRequest) {
  try {
    if (String(process.env.CIVIC_ALLOW_UNAUTH_RECEIVE).toLowerCase() !== "true") {
      return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
    }

    const packet = await req.json().catch(() => null);
    
    if (!packet?.id || !packet?.type || !packet?.from || !packet?.content) {
      return NextResponse.json({ ok: false, error: "invalid_packet" }, { status: 400 });
    }

    // TODO: verify signature, de-dupe, store in inbox
    // For now, just store the packet
    saveCivicPacket(packet);

    return NextResponse.json({ ok: true, stored: true });
  } catch (error) {
    console.error("[CIVIC] Error receiving packet:", error);
    return NextResponse.json({ ok: false, error: "receive_failed" }, { status: 500 });
  }
}
