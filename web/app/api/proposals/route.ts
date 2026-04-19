/**
 * GET /api/proposals?studentId=…&status=pending&limit=50
 *
 * Lists claims for the proposal drawer. Default filter is `status=pending`
 * because that's what the drawer shows. Joins source_files + chunks to
 * return enough context for a one-line "here's the evidence" preview.
 *
 * RLS — service role preferred; same story as /api/chunks.
 */

import { NextResponse } from "next/server";
import { DEMO_STUDENT_ID, hasSupabase } from "@/lib/utils/env";
import { getServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClaimStatus = "pending" | "confirmed" | "rejected" | "superseded";

export interface ProposalRow {
  id: string;
  subjectEntity: string;
  predicate: string;
  object: unknown;
  confidence: number;
  status: ClaimStatus;
  sensitivity: "low" | "medium" | "high";
  extractedBy: string;
  reasoning?: string | null;
  sourceFileId?: string | null;
  sourceChunkId?: string | null;
  sourceFilename?: string | null;
  sourceKind?: string | null;
  evidenceText?: string | null;
  createdAt: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") ?? DEMO_STUDENT_ID;
  const statusRaw = url.searchParams.get("status") ?? "pending";
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") ?? 50)),
  );

  const statusList = statusRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as ClaimStatus[];

  if (!hasSupabase()) {
    return NextResponse.json({ proposals: [], count: 0 });
  }

  const supabase = await getServiceSupabase();
  if (!supabase) return NextResponse.json({ proposals: [], count: 0 });

  // Grab claims + their source_file (for filename/kind) in one round trip.
  const { data, error } = await supabase
    .from("claims")
    .select(
      `
      id,
      subject_entity,
      predicate,
      object,
      confidence,
      status,
      sensitivity,
      extracted_by,
      reasoning,
      source_file_id,
      source_chunk_id,
      created_at,
      source_files(filename, kind)
    `,
    )
    .eq("student_id", studentId)
    .in("status", statusList)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[/api/proposals] query failed:", error.message);
    return NextResponse.json({ proposals: [], count: 0 });
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    subject_entity: string;
    predicate: string;
    object: unknown;
    confidence: number;
    status: ClaimStatus;
    sensitivity: "low" | "medium" | "high";
    extracted_by: string;
    reasoning: string | null;
    source_file_id: string | null;
    source_chunk_id: string | null;
    created_at: string;
    source_files: { filename: string | null; kind: string | null } | null;
  }>;

  // Second pass to fetch evidence text for chunks — only if we have any rows
  // with source_chunk_id set (cheap to skip otherwise).
  const chunkIds = rows
    .map((r) => r.source_chunk_id)
    .filter((x): x is string => Boolean(x));

  let evidenceById: Record<string, string> = {};
  if (chunkIds.length > 0) {
    const { data: chunks } = await supabase
      .from("chunks")
      .select("id, text")
      .in("id", chunkIds);
    for (const c of chunks ?? []) {
      const obj = c as unknown as { id: string; text: string };
      evidenceById[obj.id] = (obj.text ?? "").slice(0, 240);
    }
  }

  const proposals: ProposalRow[] = rows.map((r) => ({
    id: r.id,
    subjectEntity: r.subject_entity,
    predicate: r.predicate,
    object: r.object,
    confidence: r.confidence,
    status: r.status,
    sensitivity: r.sensitivity,
    extractedBy: r.extracted_by,
    reasoning: r.reasoning,
    sourceFileId: r.source_file_id,
    sourceChunkId: r.source_chunk_id,
    sourceFilename: r.source_files?.filename ?? null,
    sourceKind: r.source_files?.kind ?? null,
    evidenceText: r.source_chunk_id
      ? (evidenceById[r.source_chunk_id] ?? null)
      : null,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ proposals, count: proposals.length });
}
