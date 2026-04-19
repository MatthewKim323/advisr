/**
 * Hero-controller.
 *
 * Watches a rolling window of search queries. When the pattern matches a
 * scripted contrast (essay-heavy → transcript-heavy inside 15s), fires a
 * canned "close line" through the chat channel.
 *
 * The close line is SCRIPTED, not LLM-generated. Zero hallucination risk at
 * the hero moment. See docs/hero-storyboard.md Frame 5.
 */

import type { SourceKind, QueryHit } from "@/lib/events/types";

export interface QuerySnapshot {
  query: string;
  committedAt: number;
  hitsBySourceKind: Record<SourceKind, number>;
  hits: readonly QueryHit[];
}

export type HeroState =
  | { phase: "idle" }
  | { phase: "awaiting-second-query"; firstQuery: QuerySnapshot }
  | {
      phase: "close-fired";
      firstQuery: QuerySnapshot;
      secondQuery: QuerySnapshot;
      closeLine: string;
    };

const WINDOW_MS = 15_000;

export function shouldFireClose(q1: QuerySnapshot, q2: QuerySnapshot): boolean {
  if (q2.committedAt - q1.committedAt > WINDOW_MS) return false;
  const essayHeavy =
    q1.hitsBySourceKind.essay >= 3 &&
    q1.hitsBySourceKind.essay > q1.hitsBySourceKind.transcript;
  const transcriptHeavy =
    q2.hitsBySourceKind.transcript >= 10 &&
    q2.hitsBySourceKind.transcript > q2.hitsBySourceKind.essay * 5;
  return essayHeavy && transcriptHeavy;
}

/** Scripted close lines per theme pair. Match on lower-cased query tokens. */
export const HERO_CLOSE_LINES: ReadonlyArray<{
  firstMatches: readonly string[];
  secondMatches: readonly string[];
  line: string;
}> = [
  {
    firstMatches: ["grandmother", "grandma", "abuela"],
    secondMatches: ["robotics", "robot", "makergirl"],
    line: "You wrote the page about your grandmother. You told me about robotics. Want to write what's actually yours?",
  },
  {
    firstMatches: ["mom", "mother", "madre"],
    secondMatches: ["cello", "orchestra", "music"],
    line: "You wrote the page about your mom. You told me about cello. Both are real — but only one has fourteen transcripts behind it.",
  },
  {
    firstMatches: ["mission", "trip", "volunteer"],
    secondMatches: ["code", "coding", "program"],
    line: "You wrote about the trip. You told me about the code you shipped. Which one actually changes something about you?",
  },
];

const FALLBACK_CLOSE =
  "You wrote one thing. You told me another. Let's write the second one.";

export function pickCloseLine(
  q1: QuerySnapshot,
  q2: QuerySnapshot,
): { line: string; themePair: [string, string] } {
  const q1l = q1.query.toLowerCase();
  const q2l = q2.query.toLowerCase();
  for (const tmpl of HERO_CLOSE_LINES) {
    const m1 = tmpl.firstMatches.find((t) => q1l.includes(t));
    const m2 = tmpl.secondMatches.find((t) => q2l.includes(t));
    if (m1 && m2) return { line: tmpl.line, themePair: [m1, m2] };
  }
  return { line: FALLBACK_CLOSE, themePair: [q1.query, q2.query] };
}

export function transition(state: HeroState, q: QuerySnapshot): HeroState {
  if (state.phase === "idle") {
    return { phase: "awaiting-second-query", firstQuery: q };
  }
  if (state.phase === "awaiting-second-query") {
    if (shouldFireClose(state.firstQuery, q)) {
      const { line } = pickCloseLine(state.firstQuery, q);
      return {
        phase: "close-fired",
        firstQuery: state.firstQuery,
        secondQuery: q,
        closeLine: line,
      };
    }
    // Keep the latest as the new "first" if it's not a matching contrast.
    return { phase: "awaiting-second-query", firstQuery: q };
  }
  if (state.phase === "close-fired") {
    // Reset and let the user try another pair.
    return { phase: "awaiting-second-query", firstQuery: q };
  }
  return state;
}
