import { NextRequest, NextResponse } from "next/server";
import { signAndQueue } from "../../../../src/lib/exchange";

export async function POST(req: NextRequest) {
  try {
    const { id, to } = await req.json().catch(() => ({}));
    
    if (!id || !to) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    // TODO: lookup outbox record by id, sign, POST to peer /api/civic/receive
    // For now, just return stub response
    return NextResponse.json({ 
      ok: true, 
      delivered: false, 
      note: "stub - federation not yet implemented" 
    });
  } catch (error) {
    console.error("[CIVIC] Error sending packet:", error);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 500 });
  }
}
