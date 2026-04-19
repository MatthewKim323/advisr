/**
 * Archivist — The Memory Agent.
 *
 * Ingests uploaded artifacts. Delegates parsing to leaf workers. Owns the
 * ProposalQueue for human-in-the-loop claim approval.
 *
 * ARCHITECTURAL RULE: Archivist has no direct write tools — must delegate
 * to parser workers. Same pattern as Memopal. This forces genuine agent trees.
 *
 * Models:
 *   - Archivist itself: Claude Sonnet 4.5 (planning)
 *   - Workers: Claude Haiku (10x cheaper, plenty smart for structured parsing)
 */

export interface ArchivistInput {
  studentId: string;
  sourceFileIds: string[];
}

export async function runArchivist(_input: ArchivistInput) {
  // TODO:
  //   emit("ingestion_started");
  //   for each sourceFile:
  //     pick worker by file.kind
  //     delegate via tool call (emits agent_delegating + tool_call_*)
  //   aggregate claim counts, emit("ingestion_finished").
  throw new Error("not implemented");
}
