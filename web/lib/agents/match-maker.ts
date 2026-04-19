/**
 * Match-Maker — The School Strategist.
 *
 * Builds a personalized school list with safety/target/reach tiering.
 * Identifies hidden-gem schools where the student has an advantage.
 *
 * Ranking: admit_rate × demographic_admit_rate × institutional_fit
 *          × net_cost × grad_rate × outcome_by_major × hidden_gem_heuristics.
 *
 * Retrieval (revised): queries Human Delta against a pre-indexed `colleges`
 * library (College Scorecard, Niche profiles, CDS PDFs). No live scraping.
 * Writes: `considering_school` claims with tier.
 */

export interface MatchMakerInput {
  studentId: string;
  request?: string;   // e.g. "add one more safety in-state"
}

export async function runMatchMaker(_input: MatchMakerInput) {
  throw new Error("not implemented");
}
