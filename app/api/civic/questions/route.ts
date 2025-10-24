import { NextRequest, NextResponse } from "next/server";
import { saveCivicQuestion, getUnansweredQuestions } from "../../../../src/lib/memory";

export async function GET() {
  try {
    const questions = getUnansweredQuestions();
    return NextResponse.json({ items: questions, nextCursor: null });
  } catch (error) {
    console.error("[CIVIC] Error fetching questions:", error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { intent, principles = [], content, tags = [] } = await req.json().catch(() => ({}));
    
    if (!content || !intent) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    // Create civic question record
    const question = {
      id: `q_${Date.now()}`,
      content: String(content),
      intent: String(intent),
      principles: Array.isArray(principles) ? principles : [],
      triggered_by: "user" as const,
      status: "pending" as const,
      created_at: Date.now()
    };

    // Save to database
    saveCivicQuestion(question);

    return NextResponse.json({
      ok: true,
      record: {
        id: question.id,
        from: process.env.CIVIC_NODE_ID || "local",
        type: "question",
        intent: question.intent,
        principles: question.principles,
        content: question.content,
        tags: Array.isArray(tags) ? tags : [],
        signature: "unsigned",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("[CIVIC] Error creating question:", error);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
