/**
 * Character state machine. Every agent sprite is driven through one of these
 * states; never hand-animate. See PLAN.md §6 for the full vocabulary.
 */

export type CharacterState =
  | "idle"
  | "walk"
  | "type"
  | "read"
  | "browse"
  | "speak"
  | "handoff"
  | "wait";

export type CharacterId =
  | "dean"
  | "archivist"
  | "match-maker"
  | "bursar"
  | "scout"
  | "draft"
  | "pacer";

export interface CharacterSnapshot {
  id: CharacterId;
  state: CharacterState;
  target?: CharacterId;      // For walk / handoff
  speech?: string;           // For speak
  since: number;             // epoch ms
}

/** Map an event bus message onto a state transition. Implemented in Phase 4. */
export function reduce(
  _prev: CharacterSnapshot,
  _evt: unknown,
): CharacterSnapshot {
  throw new Error("not implemented");
}
