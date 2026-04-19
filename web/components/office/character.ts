import type { CharacterId } from "./state-machine";

/** Static office layout. Coordinates are 16-px tile units (32x32 grid). */
export const DESKS: Record<CharacterId, { x: number; y: number; big?: boolean }> = {
  dean:         { x: 14, y: 4, big: true },
  archivist:    { x: 4, y: 14 },
  "match-maker":{ x: 4, y: 4 },
  bursar:       { x: 24, y: 4 },
  scout:        { x: 8, y: 26 },
  draft:        { x: 20, y: 26 },
  pacer:        { x: 24, y: 14 },
};

export const STUDENT_COUCH = { x: 14, y: 14 };
export const FILE_DROP = { x: 14, y: 28 };
