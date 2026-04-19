/**
 * Turn a tool-call input into a short, readable "what's this agent doing
 * right now" label. Used by the office to render hover tooltips and tiny
 * on-canvas bubbles.
 *
 * Each specialist's input shape is declared in `web/lib/agents/tools.ts`.
 * We keep this file colocated with the state store (not with tools.ts) so
 * the CLIENT doesn't have to import the server-only tool definitions.
 *
 * Labels are short on purpose — ~40 chars max. The visual is meant to read
 * at a glance, not replace the chat panel.
 */

import type { CharacterId } from "@/components/office/state-machine";

/** Trim a string to `n` chars, appending … if it was clipped. */
function trim(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

/** Coerce arbitrary unknown → readable string, or empty if not stringable. */
function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Read one label out of whatever input shape came down the wire. Defensive
 *  on purpose — tool inputs are typed server-side but we treat them as
 *  `unknown` here since Claude sometimes streams partial inputs before a
 *  tool actually fires (input-start vs input-available). */
export function taskFromInput(agent: CharacterId, input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const i = input as Record<string, unknown>;

  switch (agent) {
    case "archivist": {
      const q = asStr(i.query);
      if (!q) return "searching records";
      return trim(`searching: ${q}`, 44);
    }
    case "match-maker": {
      const q = asStr(i.query);
      if (!q) return "matching schools";
      return trim(`matching: ${q}`, 44);
    }
    case "bursar": {
      const schools = Array.isArray(i.schools) ? (i.schools as string[]) : [];
      if (schools.length === 0) return "comparing aid";
      if (schools.length <= 2) return trim(`aid: ${schools.join(", ")}`, 44);
      return trim(`aid × ${schools.length}: ${schools.slice(0, 2).join(", ")}…`, 44);
    }
    case "scout": {
      const q = asStr(i.query);
      if (!q) return "scouting scholarships";
      return trim(`scouting: ${q}`, 44);
    }
    case "pacer": {
      const schools = Array.isArray(i.schools) ? (i.schools as string[]) : [];
      const gy = typeof i.graduationYear === "number" ? i.graduationYear : null;
      const prefix = gy ? `class ${gy}` : "checking deadlines";
      if (schools.length === 0) return prefix;
      return trim(`${prefix} · ${schools.slice(0, 2).join(", ")}`, 44);
    }
    case "draft": {
      const pass = typeof i.pass === "number" ? i.pass : 1;
      const len = typeof i.essayText === "string" ? (i.essayText as string).length : 0;
      const ctx = asStr(i.schoolContext);
      if (ctx) return trim(`p${pass} · ${ctx}`, 44);
      return len > 0 ? `critique pass ${pass} · ${len} chars` : `critique pass ${pass}`;
    }
    case "dean":
      return null;
  }
}

/** When no tool is active, show the agent's standing-role line. Kept short
 *  so it fits in the same tooltip shell as the live task. */
export const IDLE_TASK: Record<CharacterId, string> = {
  dean: "orchestrating",
  archivist: "archiving memory",
  "match-maker": "mapping colleges",
  bursar: "watching aid",
  scout: "sweeping listings",
  draft: "drafting critique",
  pacer: "tracking clock",
};

/** Role tagline shown when agent is fully idle (no live activity). Mirror
 *  of `specialists.ts` taglines but compressed to fit the bubble. */
export const AGENT_TAGLINE: Record<CharacterId, string> = {
  dean: "Orchestrator",
  archivist: "Memory",
  "match-maker": "School Strategist",
  bursar: "Aid & Cost",
  scout: "Scholarship Hunter",
  draft: "Essay Coach",
  pacer: "Deadline Manager",
};
