/**
 * Claim lifecycle. Append-only proposes + status mutations.
 *
 * Idempotent on (source_file_id, predicate, subject_entity). Re-running a
 * worker never duplicates claims; it only adds new ones it newly extracted.
 *
 * Client choice: prefer `SUPABASE_SERVICE_ROLE_KEY` when present so unauthed
 * demo flows (drop a file on /office with no login) can still confirm/reject.
 * The anon/cookie-bound path stays available for real student sessions.
 */

import "server-only";
import { hasSupabase } from "@/lib/utils/env";
import { emit } from "@/lib/events/bus";
import { getAdminSupabase } from "@/lib/supabase/service";

/** Row shape consumers can refer to when typing claim collections. */
export interface Claim {
  id: string;
  studentId: string;
  subjectEntity: string;
  predicate: string;
  object: unknown;
  confidence: number;
  status: "pending" | "confirmed" | "rejected" | "superseded";
  sensitivity: "low" | "medium" | "high";
  sourceArtifactId?: string | null;
  sourceChunkId?: string | null;
  sourceFileId?: string | null;
  extractedBy: string;
  reasoning?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
}

export interface ProposeArgs {
  studentId: string;
  predicate: string;
  object: unknown;
  confidence: number;
  subjectEntity?: string;
  sensitivity?: "low" | "medium" | "high";
  sourceArtifactId?: string | null;
  sourceChunkId?: string | null;
  sourceFileId?: string | null;
  extractedBy: string;
  reasoning?: string | null;
}

export interface ProposeResult {
  claimId: string;
  created: boolean; // false if idempotent hit
}

export async function propose(args: ProposeArgs): Promise<ProposeResult | null> {
  if (!hasSupabase()) return null;
  const supabase = await getAdminSupabase();
  if (!supabase) return null;

  const row = {
    student_id: args.studentId,
    subject_entity: args.subjectEntity ?? "Student",
    predicate: args.predicate,
    object: args.object,
    confidence: args.confidence,
    status: "pending" as const,
    sensitivity: args.sensitivity ?? "low",
    source_artifact_id: args.sourceArtifactId ?? null,
    source_chunk_id: args.sourceChunkId ?? null,
    source_file_id: args.sourceFileId ?? null,
    extracted_by: args.extractedBy,
    reasoning: args.reasoning ?? null,
  };

  // Upsert on the idempotency index. `ignoreDuplicates: true` returns an
  // empty array on conflict — we then SELECT to fetch the existing row.
  const { data, error } = await supabase
    .from("claims")
    .upsert(row, {
      onConflict: "source_file_id,predicate,subject_entity",
      ignoreDuplicates: true,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[claims.propose] insert failed:", error.message);
    return null;
  }

  if (data?.id) {
    emit(
      {
        type: "claim_proposed",
        claimId: data.id,
        predicate: args.predicate,
        confidence: args.confidence,
      },
      args.studentId,
    );
    return { claimId: data.id, created: true };
  }

  // Conflict — find the existing claim.
  const existing = await supabase
    .from("claims")
    .select("id")
    .eq("source_file_id", args.sourceFileId ?? "")
    .eq("predicate", args.predicate)
    .eq("subject_entity", args.subjectEntity ?? "Student")
    .maybeSingle();
  return existing.data?.id
    ? { claimId: existing.data.id, created: false }
    : null;
}

export async function confirm(
  claimId: string,
  studentId: string,
): Promise<boolean> {
  if (!hasSupabase()) return false;
  const supabase = await getAdminSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from("claims")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", claimId)
    .eq("student_id", studentId);
  if (error) return false;
  emit({ type: "claim_confirmed", claimId }, studentId);
  return true;
}

export async function reject(
  claimId: string,
  studentId: string,
  by: "user" = "user",
): Promise<boolean> {
  if (!hasSupabase()) return false;
  const supabase = await getAdminSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from("claims")
    .update({ status: "rejected" })
    .eq("id", claimId)
    .eq("student_id", studentId);
  if (error) return false;
  emit({ type: "claim_rejected", claimId, by }, studentId);
  return true;
}
