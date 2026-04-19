"use client";

/**
 * officeStore — the single source of truth for UI light-up.
 *
 * Lives on the client. Every keystroke in F1 dispatches `commitQuery` which:
 *   1. Immediately computes an *optimistic* index against a local token→chunk
 *      map (cheap; no network).
 *   2. Fires a POST /api/search in parallel.
 *   3. When the real response lands, reconcile() replaces the optimistic
 *      index with the authoritative one.
 *
 * The hero-controller subscribes to commits and emits a `hero_close_fired`
 * event when the essay → transcript contrast pattern hits.
 */

import { create } from "zustand";
import type { QueryHit, SourceKind } from "@/lib/events/types";
import {
  emptyIndex,
  indexHits,
  reconcile,
  type QueryHitIndex,
} from "@/lib/office/surface-map";
import {
  transition,
  pickCloseLine,
  type HeroState,
  type QuerySnapshot,
} from "@/lib/office/hero-controller";

export interface DeanInterjection {
  text: string;
  firedAt: number;
}

export interface OfficeState {
  query: string;
  hits: readonly QueryHit[];
  index: QueryHitIndex;
  optimistic: boolean;
  lastCommittedAt: number;
  heroState: HeroState;
  heroCloseLine: string | null;

  /** Unprompted Dean message from F2 callback agent, etc. Auto-clears ~10s
   *  after firedAt via a client-side timer (see DeanInterjectionLayer). */
  interjection: DeanInterjection | null;

  // Client-side prefix index (populated lazily as chunks arrive).
  localIndex: Map<string, QueryHit[]>;

  setQuery: (q: string) => void;
  commitOptimistic: (q: string) => void;
  commitAuthoritative: (q: string, hits: readonly QueryHit[]) => void;
  seedLocalIndex: (entries: readonly QueryHit[]) => void;
  pushInterjection: (text: string) => void;
  clearInterjection: () => void;
  reset: () => void;
}

const INITIAL: Omit<
  OfficeState,
  | "setQuery"
  | "commitOptimistic"
  | "commitAuthoritative"
  | "seedLocalIndex"
  | "pushInterjection"
  | "clearInterjection"
  | "reset"
> = {
  query: "",
  hits: [],
  index: emptyIndex(),
  optimistic: false,
  lastCommittedAt: 0,
  heroState: { phase: "idle" },
  heroCloseLine: null,
  interjection: null,
  localIndex: new Map(),
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

function buildSnapshot(
  q: string,
  hits: readonly QueryHit[],
  committedAt: number,
): QuerySnapshot {
  const bySourceKind: Record<SourceKind, number> = {
    transcript: 0,
    essay: 0,
    financial: 0,
    activity: 0,
    "college-profile": 0,
    scholarship: 0,
    "aid-policy": 0,
    "style-guide": 0,
  };
  for (const h of hits) bySourceKind[h.sourceKind]++;
  return {
    query: q,
    committedAt,
    hits,
    hitsBySourceKind: bySourceKind,
  };
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  ...INITIAL,

  setQuery: (q: string) => set({ query: q }),

  commitOptimistic: (q: string) => {
    const { localIndex } = get();
    const tokens = tokenize(q);
    const seen = new Set<string>();
    const hits: QueryHit[] = [];
    for (const t of tokens) {
      const list = localIndex.get(t);
      if (!list) continue;
      for (const h of list) {
        if (seen.has(h.chunkId)) continue;
        seen.add(h.chunkId);
        hits.push(h);
      }
    }
    set({
      query: q,
      hits,
      index: indexHits(hits),
      optimistic: true,
      lastCommittedAt: Date.now(),
    });
  },

  commitAuthoritative: (q: string, hits: readonly QueryHit[]) => {
    const now = Date.now();
    const fresh = indexHits(hits);
    const reconciled = reconcile(get().index, fresh);

    const snap = buildSnapshot(q, hits, now);
    const next = transition(get().heroState, snap);
    const closeLine =
      next.phase === "close-fired" ? pickCloseLine(next.firstQuery, next.secondQuery).line : null;

    set({
      query: q,
      hits,
      index: reconciled,
      optimistic: false,
      lastCommittedAt: now,
      heroState: next,
      heroCloseLine: closeLine,
    });
  },

  seedLocalIndex: (entries: readonly QueryHit[]) => {
    const idx = new Map<string, QueryHit[]>();
    for (const h of entries) {
      for (const t of tokenize(h.text)) {
        const list = idx.get(t) ?? [];
        list.push(h);
        idx.set(t, list);
      }
    }
    set({ localIndex: idx });
  },

  pushInterjection: (text: string) =>
    set({ interjection: { text, firedAt: Date.now() } }),

  clearInterjection: () => set({ interjection: null }),

  reset: () => set({ ...INITIAL, localIndex: get().localIndex }),
}));
