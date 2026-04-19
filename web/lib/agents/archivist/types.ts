import type { ProposeArgs } from "@/lib/graph/claims";

export interface ArchivistWorkerInput {
  studentId: string;
  sourceFileId: string | null; // null in offline eval mode
  filename: string;
  text: string;
  chunks?: Array<{ id: string; text: string; offsetStart?: number; offsetEnd?: number }>;
}

/** A claim the worker wants to propose. Slim subset of ProposeArgs — the
 *  runner fills in studentId and provenance wiring. */
export type ProposedClaim = Omit<
  ProposeArgs,
  "studentId" | "extractedBy" | "sourceFileId"
> & {
  extractedBy?: string;
};

export interface ArchivistWorkerResult {
  workerName: string;
  claims: ProposedClaim[];
  themes?: string[];
}

export type ArchivistWorker = (
  input: ArchivistWorkerInput,
) => Promise<ArchivistWorkerResult> | ArchivistWorkerResult;
