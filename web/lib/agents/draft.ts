/**
 * Draft — The Essay Coach.
 *
 * Surgical feedback. Not "add more detail." Real critique: thesis clarity,
 * show-don't-tell violations, cliché detection (calibrated to admissions
 * clichés — grandparent, game-winning shot, mission trip), voice consistency,
 * structural weakness.
 *
 * Progressive mode: Pass 1 = big-picture only. Pass 2 = sentence-level.
 *                   Pass 3 = polish. Mimics a real coach over revisions.
 *
 * Killer capability: because it reads the graph, it catches REDUNDANCY
 * across essays. "You wrote about your grandmother in Common App — doing it
 * again in UC PIQ is weak. Your voice memo has a stronger story — try that."
 */

export interface DraftInput {
  studentId: string;
  essayArtifactId: string;
  pass?: 1 | 2 | 3;
}

export async function runDraft(_input: DraftInput) {
  throw new Error("not implemented");
}
