import { describe, it, expect } from "vitest";
import {
  shouldFireClose,
  pickCloseLine,
  transition,
  type QuerySnapshot,
} from "@/lib/office/hero-controller";
import type { SourceKind } from "@/lib/events/types";

const zero = (): Record<SourceKind, number> => ({
  transcript: 0,
  essay: 0,
  financial: 0,
  activity: 0,
  "college-profile": 0,
  scholarship: 0,
  "aid-policy": 0,
  "style-guide": 0,
});

function snap(
  q: string,
  essay: number,
  transcript: number,
  at = Date.now(),
): QuerySnapshot {
  const h = zero();
  h.essay = essay;
  h.transcript = transcript;
  return { query: q, committedAt: at, hits: [], hitsBySourceKind: h };
}

describe("shouldFireClose", () => {
  it("fires on essay-heavy → transcript-heavy contrast", () => {
    const t0 = Date.now();
    const q1 = snap("grandmother", 6, 1, t0);
    const q2 = snap("robotics", 0, 14, t0 + 4_000);
    expect(shouldFireClose(q1, q2)).toBe(true);
  });

  it("does not fire outside the 15s window", () => {
    const t0 = Date.now();
    const q1 = snap("grandmother", 6, 1, t0);
    const q2 = snap("robotics", 0, 14, t0 + 16_000);
    expect(shouldFireClose(q1, q2)).toBe(false);
  });

  it("does not fire if second query isn't transcript-dominant", () => {
    const t0 = Date.now();
    const q1 = snap("grandmother", 6, 1, t0);
    const q2 = snap("robotics", 3, 4, t0 + 2_000);
    expect(shouldFireClose(q1, q2)).toBe(false);
  });
});

describe("pickCloseLine", () => {
  it("selects the scripted grandmother/robotics line", () => {
    const q1 = snap("grandmother", 6, 1);
    const q2 = snap("robotics", 0, 14, q1.committedAt + 3_000);
    const r = pickCloseLine(q1, q2);
    expect(r.line).toMatch(/grandmother/i);
    expect(r.line).toMatch(/robotics/i);
  });
});

describe("transition", () => {
  it("idle → awaiting → close on a matching pair", () => {
    let state = transition({ phase: "idle" }, snap("grandmother", 6, 1));
    expect(state.phase).toBe("awaiting-second-query");
    state = transition(state, snap("robotics", 0, 14));
    expect(state.phase).toBe("close-fired");
  });
});
