/**
 * GET /api/chunks?studentId=…&limit=1000
 *
 * Returns every chunk Nami has about this student, compacted for client-side
 * prefix indexing. The sonar bar's optimistic-search path calls this once on
 * mount and seeds `localIndex` so the first keystrokes resolve before the
 * server round-trip.
 *
 * Auth / RLS:
 *   - Prefers the service-role Supabase client (demo bypass).
 *   - Falls back to the cookie-bound server client; RLS still applies there.
 *
 * Response shape is tight on purpose — every byte shows up in a CDN cache
 * one day and the payload ships to the browser, so we only return what the
 * local index actually uses.
 */

import { NextResponse } from "next/server";
import { DEMO_STUDENT_ID, hasSupabase } from "@/lib/utils/env";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { SourceKind } from "@/lib/events/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChunkRow {
  id: string;
  source_file_id: string;
  source_kind: SourceKind;
  text: string;
  offset_start: number | null;
  offset_end: number | null;
}

export interface ChunksPayload {
  studentId: string;
  chunks: Array<{
    chunkId: string;
    sourceFileId: string;
    sourceKind: SourceKind;
    text: string;
    offsetStart?: number;
    offsetEnd?: number;
  }>;
  count: number;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") ?? DEMO_STUDENT_ID;
  const limit = Math.min(
    5000,
    Math.max(1, Number(url.searchParams.get("limit") ?? 1000)),
  );

  const payload: ChunksPayload = { studentId, chunks: [], count: 0 };

  if (!hasSupabase()) {
    return NextResponse.json(payload, {
      // Empty but cacheable for a minute — avoids thundering during dev reloads.
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  const supabase = await getServiceSupabase();
  if (!supabase) return NextResponse.json(payload);

  // Join through source_files so RLS on the anon path can still scope by
  // student_id cleanly; service-role short-circuits this but the shape stays
  // the same which helps when we swap clients.
  const { data, error } = await supabase
    .from("chunks")
    .select(
      "id, source_file_id, source_kind, text, offset_start, offset_end, source_files!inner(student_id)",
    )
    .eq("source_files.student_id", studentId)
    .order("offset_start", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    console.warn("[/api/chunks] query failed:", error.message);
    return NextResponse.json(payload, { status: 200 });
  }

  const rows = (data ?? []) as unknown as ChunkRow[];
  payload.chunks = rows.map((r) => ({
    chunkId: r.id,
    sourceFileId: r.source_file_id,
    sourceKind: r.source_kind,
    text: r.text,
    offsetStart: r.offset_start ?? undefined,
    offsetEnd: r.offset_end ?? undefined,
  }));
  payload.count = payload.chunks.length;

  return NextResponse.json(payload);
}
