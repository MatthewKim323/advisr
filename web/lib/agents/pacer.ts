/**
 * Pacer — The Deadline Manager.
 *
 * Tracks every deadline: applications, FAFSA, CSS Profile, scholarships,
 * school-specific supplementals. Proactively pings the student before
 * things go critical.
 *
 * Killer line for the pitch: "Every other AI waits for you to ask. Advisr
 * wakes up and tells you what you should be doing."
 *
 * === DESIGN NOTE: dynamic, not calendar-locked ===
 *
 * Pacer is NOT a hard-coded list of "Jan 1 = RD deadline." It computes
 * what's next relative to the student, using three inputs:
 *   1. graduation_year (from TranscriptReader)
 *   2. target schools from `considering_school` claims (Match-Maker)
 *      and `applied_to` / `accepted_to` claims (user)
 *   3. today's date (or DEMO_DATE in demo mode — see utils/env.ts)
 *
 * Cycle phases it knows about:
 *   SENIOR_FALL   (Aug–Dec)   EA/ED deadlines, supplements, FAFSA/CSS opening
 *   SENIOR_WINTER (Jan–Mar)   RD deadlines, mid-year reports, aid docs
 *   SENIOR_SPRING (Apr–May)   Decision day, waitlist windows, deposits
 *   SENIOR_SUMMER (Jun–Aug)   Housing, orientation, final transcripts
 *   JUNIOR_*                  Testing, summer programs, AP exams, essay starts
 *
 * This is why Pacer stays useful in any month. See also: DEMO_DATE env var
 * for demo-mode time-travel during recording.
 */

import type { Claim } from "@graph/claims";

export interface PacerInput {
  studentId: string;
  now?: Date;          // Injectable for demo mode; defaults to new Date() or DEMO_DATE.
}

export type CyclePhase =
  | "JUNIOR_FALL" | "JUNIOR_WINTER" | "JUNIOR_SPRING" | "JUNIOR_SUMMER"
  | "SENIOR_FALL" | "SENIOR_WINTER" | "SENIOR_SPRING" | "SENIOR_SUMMER"
  | "OUT_OF_CYCLE";

export interface PacerTask {
  id: string;
  dueDate: Date;
  title: string;                   // "UC PIQ #2 — final draft"
  category: "application" | "financial" | "testing" | "essay" | "scholarship" | "decision";
  schoolEntityId?: string;         // null = cross-cutting (FAFSA etc.)
  urgency: "critical" | "soon" | "upcoming";
  claimSource: Claim[];            // Why Pacer surfaced this
}

/** Derives the current phase from grad_year + today. Pure function, easy to test. */
export function phaseFor(_gradYear: number, _today: Date): CyclePhase {
  throw new Error("not implemented");
}

export async function runPacer(_input: PacerInput): Promise<PacerTask[]> {
  throw new Error("not implemented");
}
