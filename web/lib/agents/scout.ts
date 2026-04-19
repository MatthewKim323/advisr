/**
 * Scout — The Scholarship Hunter.
 *
 * Finds scholarships the student is eligible for. Filters with surgical
 * precision using graph claims (demographics, interests, activities,
 * financial need, intended major).
 *
 * Retrieval (revised): query Human Delta against a pre-indexed `scholarships`
 * library. Ingest from Scholarships.com, Going Merry, Fastweb (Bold.org is
 * auth-walled — skip). No live scraping.
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
