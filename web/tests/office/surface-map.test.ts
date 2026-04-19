import { describe, it, expect } from "vitest";
import { indexHits, SURFACE_MAP, emptyIndex } from "@/lib/office/surface-map";
import type { QueryHit } from "@/lib/events/types";

function hit(sk: QueryHit["sourceKind"]): QueryHit {
  return {
    chunkId: Math.random().toString(36).slice(2),
    scope: "student",
    sourceKind: sk,
    text: "sample",
    score: 1,
  };
}

describe("indexHits", () => {
  it("lights the expected desk per sourceKind", () => {
    const idx = indexHits([hit("essay"), hit("essay"), hit("transcript")]);
    expect(idx.bySourceKind.essay).toBe(2);
    expect(idx.bySourceKind.transcript).toBe(1);
    expect(idx.byAgent.draft).toBe(2); // essay → draft
    expect(idx.byAgent.archivist).toBe(1); // transcript → archivist
    expect(idx.bySurface["draft-desk.essay-drafts"]).toBe(2);
    expect(idx.bySurface["archivist-desk.transcripts-shelf"]).toBe(1);
    expect(idx.total).toBe(3);
  });

  it("empty index has all-zero counts", () => {
    const i = emptyIndex();
    expect(i.total).toBe(0);
    expect(Object.values(i.byAgent).reduce((a, b) => a + b, 0)).toBe(0);
  });

  it("every SourceKind has a surface mapping", () => {
    const keys: Array<keyof typeof SURFACE_MAP> = [
      "transcript",
      "essay",
      "financial",
      "activity",
      "college-profile",
      "scholarship",
      "aid-policy",
      "style-guide",
    ];
    for (const k of keys) {
      expect(SURFACE_MAP[k]).toBeDefined();
    }
  });
});
