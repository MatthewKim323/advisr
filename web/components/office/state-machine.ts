/**
 * Character state machine. Every sprite is driven through one of these states.
 *
 * Tier-1 agents (Archivist, Draft, Scout, Match-Maker) get the full vocabulary
 * including search-driven states (walking-to-cabinet, at-desk, dimmed).
 * Tier-2 agents (Bursar, Pacer) sit in `idle` statically — explicit 8–10h
 * savings called out in the design doc.
 */

export type CharacterState =
  | "idle"
  | "walk"
  | "walking-to-cabinet"
  | "at-desk"
  | "dimmed"
  | "type"
  | "read"
  | "browse"
  | "speak"
  | "handoff"
  | "wait"
  | "essay-highlight"
  | "scholarship-match"
  | "college-match";

export type CharacterId =
  | "dean"
  | "archivist"
  | "match-maker"
  | "bursar"
  | "scout"
  | "draft"
  | "pacer";

export const TIER_1: ReadonlySet<CharacterId> = new Set([
  "archivist",
  "draft",
  "scout",
  "match-maker",
]);

export const TIER_2: ReadonlySet<CharacterId> = new Set(["bursar", "pacer"]);

export interface CharacterSnapshot {
  id: CharacterId;
  state: CharacterState;
  target?: CharacterId;
  speech?: string;
  since: number;
}

/** Map a query-hits resolution onto a per-character state. */
export function stateForCharacter(
  id: CharacterId,
  hitsForCharacter: number,
  totalHits: number,
): CharacterState {
  if (TIER_2.has(id)) {
    return totalHits > 0 && hitsForCharacter === 0 ? "dimmed" : "idle";
  }
  if (hitsForCharacter === 0) {
    return totalHits > 0 ? "dimmed" : "idle";
  }
  // Any hit — agent lights up. Pick state variant by agent identity.
  switch (id) {
    case "archivist":
      return "walking-to-cabinet";
    case "draft":
      return "essay-highlight";
    case "scout":
      return "scholarship-match";
    case "match-maker":
      return "college-match";
    default:
      return "at-desk";
  }
}

export function reduce(
  _prev: CharacterSnapshot,
  _evt: unknown,
): CharacterSnapshot {
  throw new Error("not implemented — drive via stateForCharacter()");
}
