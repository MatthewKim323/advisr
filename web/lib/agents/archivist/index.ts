/**
 * Archivist — orchestrator for ingest workers.
 *
 * Routes a source_file to its worker by `kind`, runs extraction, dedupes
 * + proposes claims, chunks the text, emits lifecycle events.
 *
 * Pure logic — does NOT require Supabase to be configured. Callers pass in
 * a `propose` function; by default we use lib/graph/claims.propose.
 */

import { transcriptWorker } from "./workers/transcript";
import { essayWorker } from "./workers/essay";
import { financialWorker } from "./workers/financial";
import { activityWorker } from "./workers/activity";
import type { ArchivistWorker, ArchivistWorkerResult } from "./types";
import { propose, type ProposeArgs } from "@/lib/graph/claims";
import { emit } from "@/lib/events/bus";

export const WORKERS: Record<string, ArchivistWorker> = {
  transcript: transcriptWorker,
  essay: essayWorker,
  financial: financialWorker,
  activity: activityWorker,
};

export interface RunArchivistInput {
  studentId: string;
  sourceFileId: string | null;
  kind: string;
  filename: string;
  text: string;
}

export interface RunArchivistOutput {
  workerName: string;
  claimsProposed: number;
  claimsCreated: number;
  durationMs: number;
  result: ArchivistWorkerResult;
}

export async function runArchivist(
  input: RunArchivistInput,
  opts?: { proposeImpl?: typeof propose },
): Promise<RunArchivistOutput> {
  const started = Date.now();
  const worker = WORKERS[input.kind];
  if (!worker) {
    throw new Error(`No Archivist worker for kind="${input.kind}"`);
  }

  emit({ type: "agent_spawned", agent: "archivist" }, input.studentId);
  emit(
    {
      type: "tool_call_started",
      agent: "archivist",
      tool: `worker:${input.kind}`,
      input: { sourceFileId: input.sourceFileId, filename: input.filename },
    },
    input.studentId,
  );

  const result = await worker({
    studentId: input.studentId,
    sourceFileId: input.sourceFileId,
    filename: input.filename,
    text: input.text,
  });

  const proposeImpl = opts?.proposeImpl ?? propose;
  let created = 0;
  for (const c of result.claims) {
    const args: ProposeArgs = {
      studentId: input.studentId,
      predicate: c.predicate,
      object: c.object,
      confidence: c.confidence,
      subjectEntity: c.subjectEntity,
      sensitivity: c.sensitivity,
      sourceArtifactId: c.sourceArtifactId ?? null,
      sourceChunkId: c.sourceChunkId ?? null,
      sourceFileId: input.sourceFileId,
      extractedBy: c.extractedBy ?? `archivist.${result.workerName}`,
      reasoning: c.reasoning ?? null,
    };
    const r = await proposeImpl(args);
    if (r?.created) created++;
  }

  const durationMs = Date.now() - started;
  emit(
    {
      type: "tool_call_finished",
      agent: "archivist",
      tool: `worker:${input.kind}`,
      output: { claimsProposed: result.claims.length, claimsCreated: created },
    },
    input.studentId,
  );
  emit({ type: "agent_idle", agent: "archivist" }, input.studentId);

  return {
    workerName: result.workerName,
    claimsProposed: result.claims.length,
    claimsCreated: created,
    durationMs,
    result,
  };
}
