import type { CharacterId } from "@/components/office/state-machine";

/**
 * The event bus contract. Every agent action emits one of these. The office
 * canvas subscribes and animates accordingly. Never hand-animate — always
 * drive through this pipe.
 *
 * See PLAN.md §6 "The Event System".
 */

export type AgentEvent =
  // Lifecycle
  | { type: "agent_spawned"; agent: CharacterId }
  | { type: "agent_idle"; agent: CharacterId }
  | { type: "agent_blocked"; agent: CharacterId; reason: string }

  // Delegation
  | { type: "agent_delegating"; from: CharacterId; to: CharacterId; payload: unknown }

  // Tool use
  | { type: "tool_call_started"; agent: CharacterId; tool: string; input: unknown }
  | { type: "tool_call_progress"; agent: CharacterId; tool: string; pct?: number; message?: string }
  | { type: "tool_call_finished"; agent: CharacterId; tool: string; output: unknown }

  // Claims
  | { type: "claim_proposed"; claimId: string; predicate: string; confidence: number }
  | { type: "claim_confirmed"; claimId: string }
  | { type: "claim_rejected"; claimId: string; by: "user" | CharacterId }

  // Ingestion
  | { type: "file_uploaded"; sourceFileId: string; filename: string; kind: string }
  | { type: "ingestion_started"; sourceFileIds: string[] }
  | { type: "ingestion_finished"; claimsProposed: number; durationMs: number }

  // Conversation
  | { type: "response_to_user"; agent: CharacterId; text: string };

export type EventType = AgentEvent["type"];

/** Narrow helper: events that target a specific character in the canvas. */
export function targetOf(evt: AgentEvent): CharacterId | null {
  if ("agent" in evt) return evt.agent;
  if (evt.type === "agent_delegating") return evt.to;
  return null;
}
