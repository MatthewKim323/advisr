import type { CharacterId } from "@/components/office/state-machine";

/**
 * The event bus contract. Every agent action emits one of these. The office
 * canvas subscribes and animates accordingly. Never hand-animate — always
 * drive through this pipe.
 */

export type SourceKind =
  | "transcript"
  | "essay"
  | "financial"
  | "activity"
  | "college-profile"
  | "scholarship"
  | "aid-policy"
  | "style-guide";

export type Scope = "student" | "world";

export interface QueryHit {
  chunkId: string;
  sourceFileId?: string;
  /** Filename of the originating source_file. Populated for student-scope
   *  chunks so Citation hovers can render the real filename instead of an
   *  opaque chunk prefix. Absent for world-scope hits. */
  sourceFilename?: string;
  scope: Scope;
  sourceKind: SourceKind;
  text: string;
  score: number;
  offsetStart?: number;
  offsetEnd?: number;
}

export type AgentEvent =
  | { type: "agent_spawned"; agent: CharacterId }
  | { type: "agent_idle"; agent: CharacterId }
  | { type: "agent_blocked"; agent: CharacterId; reason: string }
  | { type: "agent_delegating"; from: CharacterId; to: CharacterId; payload: unknown }
  | { type: "tool_call_started"; agent: CharacterId; tool: string; input: unknown }
  | { type: "tool_call_progress"; agent: CharacterId; tool: string; pct?: number; message?: string }
  | { type: "tool_call_finished"; agent: CharacterId; tool: string; output: unknown }
  | { type: "claim_proposed"; claimId: string; predicate: string; confidence: number }
  | { type: "claim_confirmed"; claimId: string }
  | { type: "claim_rejected"; claimId: string; by: "user" | CharacterId }
  | { type: "file_uploaded"; sourceFileId: string; filename: string; kind: string }
  | { type: "ingestion_started"; sourceFileIds: string[] }
  | { type: "ingestion_finished"; claimsProposed: number; durationMs: number }
  | { type: "response_to_user"; agent: CharacterId; text: string }
  /**
   * Dean speaks UNPROMPTED (cross-essay callback, deadline alert, etc.).
   * The office canvas surfaces these in the `DeanInterjectionLayer` bubble;
   * ordinary chat-turn text uses `response_to_user` and is rendered by
   * the chat panel — DO NOT confuse the two.
   */
  | {
      type: "dean_interjection";
      source: "callback" | "pacer" | "bursar" | "archivist" | "other";
      text: string;
      /** Optional provenance for a receipt chip under the bubble. */
      chunkIds?: string[];
    }
  // Hero beat events — new in the F1/D4/D5 sprint.
  | { type: "query_committed"; query: string; studentId: string }
  | {
      type: "query_hits_resolved";
      query: string;
      hits: QueryHit[];
      optimistic: boolean;
    }
  | { type: "hero_close_fired"; closeLine: string; themePair: [string, string] };

export type EventType = AgentEvent["type"];

export function targetOf(evt: AgentEvent): CharacterId | null {
  if ("agent" in evt) return (evt as { agent: CharacterId }).agent;
  if (evt.type === "agent_delegating") return evt.to;
  return null;
}
