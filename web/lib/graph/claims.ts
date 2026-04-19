import type { Predicate } from "./predicates";

/**
 * Claims — typed facts about the student. All writes go through propose().
 * Append-only: GPA changes? Write a new claim, mark old `status='superseded'`.
 */

export type ClaimStatus = "pending" | "confirmed" | "rejected" | "superseded";

export interface Claim {
  id: string;
  subjectEntity: string;
  predicate: Predicate;
  object: unknown;
  confidence: number;              // 0..1
  status: ClaimStatus;
  sourceArtifactId: string;        // MVP: references artifacts, not evidence_units
  extractedBy: string;             // Worker or user
  reasoning: string;
  createdAt: Date;
}

export interface ProposeInput {
  predicate: Predicate;
  object: unknown;
  confidence: number;
  sourceArtifactId: string;
  reasoning: string;
  subjectEntity?: string;          // Defaults to "Student"
}

/** Worker-only write path. Always inserts with status='pending'. */
export async function propose(_input: ProposeInput): Promise<Claim> {
  throw new Error("not implemented");
}
