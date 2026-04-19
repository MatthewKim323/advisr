/**
 * Scout — The Scholarship Hunter.
 *
 * Finds scholarships the student is eligible for. Filters with surgical
 * precision using graph claims (demographics, interests, activities,
 * financial need, intended major).
 *
 * Open question: pick ONE site — Bold.org (auth wall), Scholarships.com,
 * Going Merry, Fastweb — evaluate and own it. See PLAN.md §11.
 *
 * Writes `eligible_for_scholarship` claims.
 */

export interface ScoutInput {
  studentId: string;
  limit?: number;
}

export async function runScout(_input: ScoutInput) {
  throw new Error("not implemented");
}
