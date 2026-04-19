/**
 * assets.ts — sprite-sheet tile references.
 *
 * Tile coordinates are (col, row) inside the source sheet. Everything is
 * 16×16 with zero spacing in both the Donarg office tileset (256×512 =
 * 16×32 grid) and the Kenney RPG Urban packed map (432×288 = 27×18 grid).
 *
 * These indices are initial best-guesses from visual inspection — hit the
 * `~` key in dev to open the TileAtlas picker and correct any that look off.
 */

/* ──────────────────────────────────────────────────────────────
   Sprite sheets
   ────────────────────────────────────────────────────────────── */

export const SHEET_OFFICE = "/sprites/office/tileset-16-noshadow.png";
export const SHEET_OFFICE_SHADOW = "/sprites/office/tileset-16.png";
export const SHEET_CHARS  = "/sprites/chars/kenney-urban.png";

export const TILE = 16;        // native tile size, px
export const RENDER_SCALE = 3; // integer zoom — keeps pixels crisp

/* ──────────────────────────────────────────────────────────────
   Donarg Office Tileset (16×32 grid)

   A Tile is either a single 16×16 cell or a multi-tile cluster
   stamped together. Multi-tile objects declare { w, h } in source tiles.
   ────────────────────────────────────────────────────────────── */

export type Tile = { col: number; row: number; w?: number; h?: number };

export const OFFICE = {
  // Floors (bottom of the sheet — try several, pick the best-looking in-scene)
  floorCheckered: { col: 0,  row: 24 } as Tile,
  floorPlank:     { col: 4,  row: 24 } as Tile,
  floorCarpet:    { col: 8,  row: 24 } as Tile,
  floorTile:      { col: 12, row: 24 } as Tile,

  // Walls — Donarg doesn't ship formal walls, we use the steel-grey band
  wallPlain:      { col: 0,  row: 5  } as Tile,
  wallTrim:       { col: 0,  row: 6  } as Tile,

  // Desks — multi-tile. Wood-top desks (warm)
  deskWoodSmall:  { col: 0,  row: 0, w: 2, h: 1 } as Tile,  // 2×1 wood desk
  deskWoodMed:    { col: 2,  row: 0, w: 3, h: 1 } as Tile,  // 3×1 wood desk
  deskWoodLarge:  { col: 5,  row: 0, w: 3, h: 2 } as Tile,  // 3×2 corner desk
  deskGreyMed:    { col: 8,  row: 2, w: 3, h: 1 } as Tile,  // 3×1 grey desk
  deskDean:       { col: 0,  row: 2, w: 4, h: 2 } as Tile,  // 4×2 executive desk

  // Seating
  chairPink:      { col: 0,  row: 9  } as Tile,
  chairGrey:      { col: 1,  row: 9  } as Tile,
  chairBlue:      { col: 2,  row: 9  } as Tile,
  chairWhite:     { col: 3,  row: 9  } as Tile,
  chairRed:       { col: 4,  row: 9  } as Tile,

  sofaBlue:       { col: 0,  row: 11, w: 3, h: 1 } as Tile,
  sofaGrey:       { col: 3,  row: 11, w: 3, h: 1 } as Tile,

  // Desk-top accessories
  monitor:        { col: 11, row: 12 } as Tile,
  monitorDual:    { col: 9,  row: 12, w: 2, h: 1 } as Tile,
  laptop:         { col: 13, row: 12 } as Tile,
  phone:          { col: 11, row: 13 } as Tile,
  printer:        { col: 12, row: 13 } as Tile,
  clock:          { col: 0,  row: 14 } as Tile,
  coffee:         { col: 2,  row: 14 } as Tile,
  stapler:        { col: 3,  row: 14 } as Tile,

  // Shelving + storage
  bookshelf:      { col: 8,  row: 5,  w: 2, h: 2 } as Tile,
  bookshelfTall:  { col: 10, row: 5,  w: 2, h: 3 } as Tile,
  filingCabinet:  { col: 12, row: 5,  w: 1, h: 2 } as Tile,
  acUnit:         { col: 14, row: 3,  w: 2, h: 1 } as Tile,

  // Greenery + accents
  plantTall:      { col: 0,  row: 15 } as Tile,
  plantBush:      { col: 1,  row: 15 } as Tile,
  plantPot:       { col: 2,  row: 15 } as Tile,
  cactus:         { col: 3,  row: 15 } as Tile,

  // Boxes, crates, clutter
  boxSmall:       { col: 8,  row: 16 } as Tile,
  boxStacked:     { col: 9,  row: 16, w: 2, h: 2 } as Tile,

  // Wall-hung — charts, whiteboards, windows (used as porthole surrogates)
  window:         { col: 0,  row: 13, w: 2, h: 1 } as Tile,
  whiteboard:     { col: 2,  row: 13, w: 2, h: 1 } as Tile,
  chartBar:       { col: 4,  row: 13, w: 2, h: 1 } as Tile,
  chartPie:       { col: 6,  row: 13, w: 2, h: 1 } as Tile,
} as const;

/* ──────────────────────────────────────────────────────────────
   Kenney RPG Urban characters (27×18 grid)

   The pack ships 6 distinct characters in the upper-right region of
   the atlas, each with 4 directional sprites (down, up, left, right)
   and 2 animation frames per direction. Actual tile coords need
   verification via the TileAtlas picker.
   ────────────────────────────────────────────────────────────── */

export type CharSprite = {
  name: string;
  /** Tile coord of the character's "facing down, frame 0" sprite. */
  baseCol: number;
  baseRow: number;
};

// First-pass guess: characters occupy cols 24-26, 2 tiles tall each,
// with the FACE-DOWN frame at the top row of their block.
// If they look wrong, use the atlas picker to re-map.
export const CHARS = {
  male_business:   { name: "male_business",   baseCol: 24, baseRow: 0  } as CharSprite,
  female_suit:     { name: "female_suit",     baseCol: 25, baseRow: 0  } as CharSprite,
  male_casual:     { name: "male_casual",     baseCol: 26, baseRow: 0  } as CharSprite,
  female_casual:   { name: "female_casual",   baseCol: 24, baseRow: 3  } as CharSprite,
  male_hoodie:     { name: "male_hoodie",     baseCol: 25, baseRow: 3  } as CharSprite,
  female_glasses:  { name: "female_glasses",  baseCol: 26, baseRow: 3  } as CharSprite,
  male_hat:        { name: "male_hat",        baseCol: 24, baseRow: 6  } as CharSprite,
} as const;

export type Facing = "down" | "up" | "left" | "right";

/** Returns (col,row) for a given character, facing, and anim frame (0 or 1). */
export function charFrame(
  c: CharSprite,
  facing: Facing,
  frame: 0 | 1,
): { col: number; row: number } {
  // Kenney standard: 4 facings × 2 frames packed as a 2×4 block.
  //   col offset: frame (0 or 1)
  //   row offset: facing order down → up → left → right
  const rowOffset = { down: 0, up: 1, left: 2, right: 3 }[facing];
  return {
    col: c.baseCol + frame,
    row: c.baseRow + rowOffset,
  };
}
