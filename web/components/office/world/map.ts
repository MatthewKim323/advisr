/**
 * map.ts — Bathysphere-7 floor plan.
 *
 * The hull is a stadium/capsule: rectangle with two semicircular end-caps
 * (bow on the right, stern on the left). 24 × 12 tiles @ 16px each.
 *
 * Each agent gets a **stateroom** — their own 2×4 cubicle comprising a
 * bunk (for off-shift/sleeping state), a desk with a monitor or laptop
 * (working state), and a chair. Dean gets a captain's quarters at the
 * bow with a king bunk, big exec desk, and his own chair.
 *
 * Top-row staterooms use rows 1-4; bottom-row staterooms mirror at rows
 * 7-10. The aisle (rows 5-6) runs fore-to-aft with a file hatch
 * recessed into the deck and a visitor couch off to the side.
 */

import { OFFICE, Tile, CHARS } from "./assets";

export const GRID_W = 24;
export const GRID_H = 12;

/** End-cap radius (tiles). Stadium curvature is R = GRID_H / 2. */
export const HULL_R = GRID_H / 2;

/** Agent activity state — drives whether the sprite renders at the chair
 *  or on the bunk, and whether the laptop screen is lit. */
export type Activity = "working" | "sleeping" | "away";

export type StationSpec = {
  id:
    | "dean"
    | "archivist"
    | "match-maker"
    | "bursar"
    | "scout"
    | "draft"
    | "pacer";
  label: string;
  role: string;

  /** Bunk rect (tile coords, top-left). Standard is 2×2; Dean is 3×2. */
  bunk:  { x: number; y: number; w: number; h: number };

  /** Desk rect (tile coords, top-left). Standard is 2×1; Dean is 4×2. */
  desk:  { x: number; y: number; w: number; h: number };

  /** Chair position — 1 tile. Character works here. */
  chair: { x: number; y: number };

  facing: "down" | "up" | "left" | "right";
  charKey: keyof typeof CHARS;
  deskItem: Tile;
  deskTile: Tile;

  activity: Activity;

  /** Hex color for this agent's bunk blanket — visual identity. */
  blanket: string;
};

export type Obj = {
  tile: Tile;
  x: number;
  y: number;
};

/* ──────────────────────────────────────────────────────────────
   Layout (24 × 12, R = 6)

       0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
    0  ········ ═══════════════════ ··············
    1  ···.. B B . . B B . . B B . . . . . . .· ·
    2  ··.. . B B . . B B . . B B . . [D.BUNK3w] · ·
    3  ··.. . . . . . . . . . . . . . . . . . . ·· ·
    4  ··.. . D D . . D D . . D D . . . . . . .· ·
    5  ·.. . . m . . . m . . . m . [ DEAN DESK ] · ·
    6  ·.. . C . . . C . . . C . . .[         ] · ·
    7  ·.. . C . . . C . . . C . . . . . C . . .· ·
    8  ··.. . D D . . D D . . D D . . . . . . .· ·
    9  ··.. . m . . . m . . . m . . . . . . . ·· ·
   10  ··.. . B B . . B B . . B B . . . . . . .· ·
   11  ········ ═══════════════════ ··············
   ────────────────────────────────────────────────────────────── */

/* All stations use the same stateroom pattern: bunk → chair → desk,
 * all facing DOWN. This gives every character's face to the viewer and
 * keeps the chair/desk relationship correct (char looks at their desk).
 *
 *   Top row (rows 1-5):
 *     y=1-2  bunk (2×2)       against top hull
 *     y=3    chair             char sits here, face visible
 *     y=4    desk (2×1)        directly in front of char
 *     y=5    nameplate         just under desk
 *
 *   Bottom row (rows 7-10):  (symmetric reflection)
 *     y=7    chair
 *     y=8    desk
 *     y=9-10 bunk              against bottom hull
 *     also facing DOWN → char still shows face, desk is in front
 *
 *   Aisle:   rows 5-6  (hatch, decor, walking room)
 */

export const STATIONS: StationSpec[] = [
  // ── Top row
  {
    id: "match-maker",
    label: "Match-Maker",
    role: "NAV",
    bunk:  { x: 5,  y: 1, w: 2, h: 2 },
    chair: { x: 5,  y: 3 },
    desk:  { x: 5,  y: 4, w: 2, h: 1 },
    facing: "down",
    charKey: "female_suit",
    deskTile: OFFICE.deskGreyMed,
    deskItem: OFFICE.monitorDual,
    activity: "working",
    blanket: "#d14d8a",
  },
  {
    id: "archivist",
    label: "Archivist",
    role: "RECORDS",
    bunk:  { x: 9,  y: 1, w: 2, h: 2 },
    chair: { x: 9,  y: 3 },
    desk:  { x: 9,  y: 4, w: 2, h: 1 },
    facing: "down",
    charKey: "female_glasses",
    deskTile: OFFICE.deskGreyMed,
    deskItem: OFFICE.monitor,
    activity: "working",
    blanket: "#4a7ec8",
  },
  {
    id: "pacer",
    label: "Pacer",
    role: "OPS",
    bunk:  { x: 13, y: 1, w: 2, h: 2 },
    chair: { x: 13, y: 3 },
    desk:  { x: 13, y: 4, w: 2, h: 1 },
    facing: "down",
    charKey: "male_business",
    deskTile: OFFICE.deskGreyMed,
    deskItem: OFFICE.monitor,
    activity: "sleeping",
    blanket: "#c9732a",
  },

  // ── Bottom row (mirror — bunk at hull, char faces down toward desk)
  {
    id: "bursar",
    label: "Bursar",
    role: "FIN",
    bunk:  { x: 5,  y: 9, w: 2, h: 2 },
    chair: { x: 5,  y: 7 },
    desk:  { x: 5,  y: 8, w: 2, h: 1 },
    facing: "down",
    charKey: "male_hoodie",
    deskTile: OFFICE.deskGreyMed,
    deskItem: OFFICE.laptop,
    activity: "working",
    blanket: "#4aa87e",
  },
  {
    id: "scout",
    label: "Scout",
    role: "RECON",
    bunk:  { x: 9,  y: 9, w: 2, h: 2 },
    chair: { x: 9,  y: 7 },
    desk:  { x: 9,  y: 8, w: 2, h: 1 },
    facing: "down",
    charKey: "female_casual",
    deskTile: OFFICE.deskGreyMed,
    deskItem: OFFICE.laptop,
    activity: "sleeping",
    blanket: "#8a5ec4",
  },
  {
    id: "draft",
    label: "Draft",
    role: "COMMS",
    bunk:  { x: 13, y: 9, w: 2, h: 2 },
    chair: { x: 13, y: 7 },
    desk:  { x: 13, y: 8, w: 2, h: 1 },
    facing: "down",
    charKey: "male_casual",
    deskTile: OFFICE.deskGreyMed,
    deskItem: OFFICE.monitor,
    activity: "working",
    blanket: "#d8b74a",
  },

  // ── Dean's captain's quarters (bow)
  {
    id: "dean",
    label: "Dean",
    role: "COMMAND",
    bunk:  { x: 17, y: 1, w: 3, h: 2 },
    chair: { x: 18, y: 4 },
    desk:  { x: 17, y: 5, w: 4, h: 2 },
    facing: "down",
    charKey: "male_hat",
    deskTile: OFFICE.deskDean,
    deskItem: OFFICE.monitorDual,
    activity: "working",
    blanket: "#8a1e2b",
  },
];

/** Non-station decor. */
export const DECOR: Obj[] = [
  // Stern-cap plants
  { tile: OFFICE.plantTall, x: 3, y: 4 },
  { tile: OFFICE.plantBush, x: 3, y: 8 },

  // Bookshelf in Dean's quarters
  { tile: OFFICE.bookshelf, x: 17, y: 3 },

  // Small crate in the aisle (clutter that reads as "lived in")
  { tile: OFFICE.boxSmall,  x: 16, y: 8 },
];

/** Porthole — stern cap, looking at the wake. */
export const PORTHOLE_RECT = {
  cx: 2.2,
  cy: GRID_H / 2,
  r:  1.6,
};

/** File hatch — recessed into the aisle floor. */
export const HATCH_RECT = {
  cx: 8,
  cy: 5.5,
  r:  0.75,
};

export function insideHull(x: number, y: number): boolean {
  const R = HULL_R;
  const midY = GRID_H / 2;
  if (x >= R && x <= GRID_W - R) return y >= 0 && y <= GRID_H;
  if (x < R) {
    const dx = x - R;
    const dy = y - midY;
    return dx * dx + dy * dy <= R * R;
  }
  const dx = x - (GRID_W - R);
  const dy = y - midY;
  return dx * dx + dy * dy <= R * R;
}
