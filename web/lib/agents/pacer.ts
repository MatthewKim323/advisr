/**
 * Pacer — The Deadline Manager.
 *
 * Pure-logic specialist. No LLM, no Human Delta, no graph needed (today).
 * Computes: given a grad year + a list of target schools + today's date,
 * what's due soonest and how critical is it.
 *
 * === Design (dynamic, not calendar-locked) ===
 *
 * Pacer is NOT a hard-coded "Jan 1 = RD deadline." The source of truth is
 * the deadline table in `./pacer/deadlines.ts` (universal + per-school rows
 * with month/day + cycleYear). At query time we resolve each row to an
 * absolute Date relative to the student's senior-year window, drop anything
 * already past, and rank by days-until.
 *
 * Cycle phases:
 *   SENIOR_FALL   (Aug–Dec)   EA/ED deadlines, supplements, FAFSA/CSS opening
 *   SENIOR_WINTER (Jan–Mar)   RD deadlines, mid-year reports, aid docs
 *   SENIOR_SPRING (Apr–May)   Decision day, waitlist windows, deposits
 *   SENIOR_SUMMER (Jun–Aug)   Housing, orientation, final transcripts
 *   JUNIOR_*                  Testing, summer programs, AP exams, essay starts
 *
 * Demo-mode time travel: honor `DEMO_DATE` env var so we can record a pitch
 * video in November and have Pacer think it's October 20th. See utils/env.ts.
 */

import type { Claim } from "@graph/claims";
import {
  SCHOOL_DEADLINES,
  UNIVERSAL_DEADLINES,
  normalizeSchool,
  prettySchool,
  type DeadlineEntry,
  type PacerCategory,
} from "./pacer/deadlines";

export type CyclePhase =
  | "JUNIOR_FALL"
  | "JUNIOR_WINTER"
  | "JUNIOR_SPRING"
  | "JUNIOR_SUMMER"
  | "SENIOR_FALL"
  | "SENIOR_WINTER"
  | "SENIOR_SPRING"
  | "SENIOR_SUMMER"
  | "OUT_OF_CYCLE";

export type PacerUrgency = "critical" | "soon" | "upcoming";

export interface PacerTask {
  id: string;
  dueDate: Date;
  daysUntil: number;
  title: string;
  category: PacerCategory;
  schoolSlug: string | null; // null = universal / cross-cutting
  schoolLabel: string | null;
  round: DeadlineEntry["round"] | null;
  urgency: PacerUrgency;
  note?: string;
  claimSource: Claim[]; // filled when graph lands; empty for now
}

export interface PacerInput {
  /** The year the student finishes high school. Used to anchor the senior
   *  fall/spring calendar. Required because Pacer can't infer it without
   *  the graph. */
  graduationYear: number;
  /** Target schools as free-form names — we normalize to slugs internally. */
  schools?: string[];
  /** Testability: lets us fix "today" for unit tests + demo recording.
   *  Defaults to `DEMO_DATE` env (if set) or `new Date()`. */
  now?: Date;
}

export interface PacerOutput {
  today: string; // ISO yyyy-mm-dd
  phase: CyclePhase;
  graduationYear: number;
  schoolsRecognized: string[]; // slugs we had rows for
  schoolsUnknown: string[];    // slugs we didn't — caller should note
  tasks: PacerTask[];          // sorted by urgency → days-until
}

// ──────────────────────────────────────────────────────────────────────
// Internals
// ──────────────────────────────────────────────────────────────────────

/** Read demo-override date from env or fall back to the real clock. */
function defaultNow(): Date {
  const raw = process.env.DEMO_DATE;
  if (!raw) return new Date();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

/** Resolve a deadline row's month/day into an absolute Date, anchored to
 *  the student's senior cycle. Senior FALL rows resolve to (gradYear - 1);
 *  senior SPRING rows resolve to gradYear itself. */
function resolveDate(entry: DeadlineEntry, graduationYear: number): Date {
  const year = entry.cycleYear === "fall" ? graduationYear - 1 : graduationYear;
  // Month is 1-12 in our data; Date constructor wants 0-11.
  return new Date(year, entry.month - 1, entry.day);
}

/** Derive the current phase from grad year + today. Pure function. */
export function phaseFor(graduationYear: number, today: Date): CyclePhase {
  const month = today.getMonth() + 1; // 1-12
  const year = today.getFullYear();

  // Anchor points for senior year:
  const seniorFallStart = new Date(graduationYear - 1, 7, 1); // Aug 1
  const seniorWinterStart = new Date(graduationYear, 0, 1); // Jan 1
  const seniorSpringStart = new Date(graduationYear, 3, 1); // Apr 1
  const seniorSummerStart = new Date(graduationYear, 5, 1); // Jun 1
  const seniorSummerEnd = new Date(graduationYear, 7, 31);

  if (today >= seniorFallStart && today < seniorWinterStart) return "SENIOR_FALL";
  if (today >= seniorWinterStart && today < seniorSpringStart) return "SENIOR_WINTER";
  if (today >= seniorSpringStart && today < seniorSummerStart) return "SENIOR_SPRING";
  if (today >= seniorSummerStart && today <= seniorSummerEnd) return "SENIOR_SUMMER";

  // Junior year = the full 12 months before senior_fall_start.
  const juniorFallStart = new Date(graduationYear - 2, 7, 1);
  if (today >= juniorFallStart && today < seniorFallStart) {
    if (month >= 8 && month <= 11) return "JUNIOR_FALL";
    if (month === 12 || month <= 2) return "JUNIOR_WINTER";
    if (month >= 3 && month <= 5) return "JUNIOR_SPRING";
    return "JUNIOR_SUMMER";
  }

  return "OUT_OF_CYCLE"; // Too early (freshman/sophomore) or too late (gap year)
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 86_400_000;
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((aUTC - bUTC) / MS_PER_DAY);
}

function urgencyOf(daysUntil: number): PacerUrgency {
  if (daysUntil <= 14) return "critical";
  if (daysUntil <= 45) return "soon";
  return "upcoming";
}

// ──────────────────────────────────────────────────────────────────────
// Public entry point
// ──────────────────────────────────────────────────────────────────────

/** Compute the prioritized task list for this student, right now. Pure,
 *  deterministic, safe to call synchronously. Stays synchronous on purpose —
 *  callers can Promise.resolve() it for the tool `execute` contract. */
export function runPacer(input: PacerInput): PacerOutput {
  const today = input.now ?? defaultNow();
  const phase = phaseFor(input.graduationYear, today);

  // Build school filter. Empty = all schools in the table (so Pacer is still
  // useful before the student has locked in a list).
  const requestedSlugs = (input.schools ?? [])
    .map((s) => ({ raw: s, slug: normalizeSchool(s) }))
    .filter((s) => s.slug.length > 0);

  // Partition requested into "recognized" (we have rows) vs "unknown".
  const knownScopes = new Set(SCHOOL_DEADLINES.map((e) => e.scope));
  const recognized: string[] = [];
  const unknown: string[] = [];
  for (const r of requestedSlugs) {
    if (knownScopes.has(r.slug)) recognized.push(r.slug);
    else unknown.push(r.raw);
  }
  const recognizedSet = new Set(recognized);

  // Gather relevant entries:
  //   - All universal rows
  //   - Per-school rows whose scope matches a recognized school
  //     (OR every per-school row if no schools were requested)
  const schoolEntries = SCHOOL_DEADLINES.filter((e) =>
    recognizedSet.size === 0 ? true : recognizedSet.has(e.scope),
  );
  const all: DeadlineEntry[] = [...UNIVERSAL_DEADLINES, ...schoolEntries];

  // Resolve to absolute dates, drop past, rank.
  const tasks: PacerTask[] = all
    .map((entry) => {
      const dueDate = resolveDate(entry, input.graduationYear);
      const daysUntil = daysBetween(dueDate, today);
      return { entry, dueDate, daysUntil };
    })
    .filter(({ daysUntil }) => daysUntil >= -1) // tolerate "yesterday" for UI honesty
    .map(({ entry, dueDate, daysUntil }) => ({
      id: entry.id,
      dueDate,
      daysUntil,
      title: entry.title,
      category: entry.category,
      schoolSlug: entry.scope === "universal" ? null : entry.scope,
      schoolLabel: entry.scope === "universal" ? null : prettySchool(entry.scope),
      round: entry.round ?? null,
      urgency: urgencyOf(daysUntil),
      note: entry.note,
      claimSource: [],
    }))
    .sort((a, b) => {
      // Urgency first, then days-until.
      const order = { critical: 0, soon: 1, upcoming: 2 } as const;
      const d = order[a.urgency] - order[b.urgency];
      return d !== 0 ? d : a.daysUntil - b.daysUntil;
    });

  return {
    today: today.toISOString().slice(0, 10),
    phase,
    graduationYear: input.graduationYear,
    schoolsRecognized: recognized,
    schoolsUnknown: unknown,
    tasks,
  };
}
