import { NextResponse } from "next/server";

/**
 * POST /api/upload
 *
 * Accepts multipart file uploads, writes to Supabase storage, inserts a
 * `source_files` row, emits `file_uploaded`. Does NOT trigger ingestion —
 * Archivist is invoked separately once the student hits "process."
 */
export async function POST(_req: Request) {
  // TODO: stream files → Supabase storage → source_files insert → emit event.
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
