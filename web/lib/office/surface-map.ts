/**
 * Source-to-UI binding layer.
 *
 * Every `SourceKind` maps to a surface ID the PixelWorld/Constellation can
 * light up. Client-only — these IDs mean nothing to the server.
 *
 * If you add a SourceKind in lib/events/types.ts, add a row here and a
 * surface renderer in PixelWorld.tsx. Compile will remind you.
 */

import type { SourceKind, QueryHit } from "@/lib/events/types";
import type { CharacterId } from "@/components/office/state-machine";

/** Concrete surface IDs rendered in PixelWorld. */
export type SurfaceId =
  | "archivist-desk.transcripts-shelf"
  | "archivist-desk.general"
  | "draft-desk.essay-drafts"
  | "scout-desk.scholarship-cards"
  | "match-maker-desk.college-cards"
  | "bursar-desk.general"
  | "pacer-desk.general";

export interface SurfaceDescriptor {
  surfaceId: SurfaceId;
  ownerAgent: CharacterId;
}

export const SURFACE_MAP: Record<SourceKind, SurfaceDescriptor> = {
  transcript: {
    surfaceId: "archivist-desk.transcripts-shelf",
    ownerAgent: "archivist",
  },
  essay: {
    surfaceId: "draft-desk.essay-drafts",
    ownerAgent: "draft",
  },
  financial: {
    surfaceId: "bursar-desk.general",
    ownerAgent: "bursar",
  },
  activity: {
    surfaceId: "archivist-desk.general",
    ownerAgent: "archivist",
  },
  "college-profile": {
    surfaceId: "match-maker-desk.college-cards",
    ownerAgent: "match-maker",
  },
  scholarship: {
    surfaceId: "scout-desk.scholarship-cards",
    ownerAgent: "scout",
  },
  "aid-policy": {
    surfaceId: "bursar-desk.general",
    ownerAgent: "bursar",
  },
  "style-guide": {
    surfaceId: "draft-desk.essay-drafts",
    ownerAgent: "draft",
  },
};

/**
 * Client-side index. Aggregates hits by surface + agent so PixelWorld can
 * query a single key for its glow state.
 *
 * Exposed as a plain record-of-counts rather than a Map so zustand selectors
 * can do shallow equality cheaply.
 */
export interface QueryHitIndex {
  byAgent: Record<CharacterId, number>;
  bySurface: Record<SurfaceId, number>;
  bySourceKind: Record<SourceKind, number>;
  total: number;
}

export function emptyIndex(): QueryHitIndex {
  return {
    byAgent: {
      dean: 0,
      archivist: 0,
      "match-maker": 0,
      bursar: 0,
      scout: 0,
      draft: 0,
      pacer: 0,
    },
    bySurface: {
      "archivist-desk.transcripts-shelf": 0,
      "archivist-desk.general": 0,
      "draft-desk.essay-drafts": 0,
      "scout-desk.scholarship-cards": 0,
      "match-maker-desk.college-cards": 0,
      "bursar-desk.general": 0,
      "pacer-desk.general": 0,
    },
    bySourceKind: {
      transcript: 0,
      essay: 0,
      financial: 0,
      activity: 0,
      "college-profile": 0,
      scholarship: 0,
      "aid-policy": 0,
      "style-guide": 0,
    },
    total: 0,
  };
}

export function indexHits(hits: readonly QueryHit[]): QueryHitIndex {
  const idx = emptyIndex();
  for (const h of hits) {
    const desc = SURFACE_MAP[h.sourceKind];
    idx.bySourceKind[h.sourceKind]++;
    idx.bySurface[desc.surfaceId]++;
    idx.byAgent[desc.ownerAgent]++;
    idx.total++;
  }
  return idx;
}

/**
 * Reconcile an optimistic result with the authoritative server result.
 *
 * The optimistic pass hits the client's prefix index; the server pass adds
 * newly-ingested chunks the client didn't know about (superset) OR corrects
 * false-positive matches (subset).
 *
 * Strategy: the authoritative result wins. We return it verbatim.
 * Callers animate the diff however they like.
 */
export function reconcile(
  _optimistic: QueryHitIndex,
  authoritative: QueryHitIndex,
): QueryHitIndex {
  return authoritative;
}
