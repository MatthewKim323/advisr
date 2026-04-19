import { NextResponse } from "next/server";

/**
 * GET /api/events
 *
 * SSE fallback for the event bus. Primary transport is Supabase Realtime
 * (see lib/events/client.ts); this route exists for local dev and debugging.
 */
export async function GET(_req: Request) {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
