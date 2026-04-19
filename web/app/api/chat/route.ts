import { NextResponse } from "next/server";

/**
 * POST /api/chat
 *
 * Streams Dean's response. Dean reads the graph, decides which specialist
 * to delegate to, runs tool calls, emits events throughout.
 *
 * Body: { messages: UIMessage[], studentId: string }
 * Returns: Vercel AI SDK streaming response.
 */
export async function POST(_req: Request) {
  // TODO: import { runDean } from "@agents/dean"; pipe through toAIStreamResponse.
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
