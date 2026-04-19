/**
 * POST /api/callback/essay-opened
 *
 * Fired when the student opens an essay — either by clicking a citation in
 * Dean's chat, or by clicking an essay surface on the pixel deck. Runs the
 * F2 cross-essay callback agent and emits a `response_to_user` event, which
 * the office page's DeanInterjection subscriber surfaces as an unprompted
 * Dean message.
 *
 * Body:
 *   { studentId: string, essayFileId: string, essayText?: string }
 *
 * The client may pass `essayText` directly — useful in local/demo mode when
 * Supabase isn't reachable from the server runtime. When present, the
 * callback agent uses it verbatim instead of re-fetching.
 */

import { NextResponse } from "next/server";
import { runCallback } from "@/lib/agents/callback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    studentId?: string;
    essayFileId?: string;
    essayText?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const { studentId, essayFileId, essayText } = body;
  if (!studentId || !essayFileId) {
    return NextResponse.json(
      { ok: false, error: "studentId + essayFileId required" },
      { status: 400 },
    );
  }

  try {
    const result = await runCallback({
      studentId,
      openedEssayFileId: essayFileId,
      openedEssayText: essayText ?? "",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "callback failed" },
      { status: 500 },
    );
  }
}
