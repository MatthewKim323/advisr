/**
 * D6 — demo-mode response cache.
 *
 * During recording we hit the exact same queries over and over. Caching HD
 * responses by query hash means the hero beat lands in <200ms every take
 * instead of rolling the dice on network.
 *
 * Enabled only when DEMO_MODE=true. Unconditional dev use would mask real
 * latency bugs.
 */

import { createHash } from "crypto";
import { DEMO_MODE } from "@/lib/utils/env";
import type { SearchResult } from "humandelta";

export interface CachedResponse {
  query: string;
  results: SearchResult[];
  cachedAt: string;
}

type Cache = Map<string, CachedResponse>;

const GLOBAL_KEY = "__nami_demo_cache__" as const;

function getState(): Cache {
  const g = globalThis as unknown as Record<string, unknown>;
  let c = g[GLOBAL_KEY] as Cache | undefined;
  if (!c) {
    c = new Map<string, CachedResponse>();
    g[GLOBAL_KEY] = c;
  }
  return c;
}

export function keyFor(query: string): string {
  return createHash("sha256").update(query.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function get(query: string): SearchResult[] | null {
  if (!DEMO_MODE) return null;
  const cache = getState();
  return cache.get(keyFor(query))?.results ?? null;
}

export function set(query: string, results: SearchResult[]): void {
  if (!DEMO_MODE) return;
  const cache = getState();
  cache.set(keyFor(query), {
    query,
    results,
    cachedAt: new Date().toISOString(),
  });
}

export function hydrate(entries: Array<{ query: string; results: SearchResult[] }>): void {
  if (!DEMO_MODE) return;
  const cache = getState();
  for (const e of entries) {
    cache.set(keyFor(e.query), {
      query: e.query,
      results: e.results,
      cachedAt: new Date().toISOString(),
    });
  }
}

export function snapshot(): CachedResponse[] {
  return Array.from(getState().values());
}
