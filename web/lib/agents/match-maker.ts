/**
 * Match-Maker — The School Strategist.
 *
 * Builds a personalized school list with safety/target/reach tiering.
 * Identifies hidden-gem schools where the student has an advantage.
 *
 * Ranking: admit_rate × demographic_admit_rate × institutional_fit
 *          × net_cost × grad_rate × outcome_by_major × hidden_gem_heuristics.
 *
 * Tools: browser-use on College Scorecard + Niche. CDS cached for speed.
 * Writes: `considering_school` claims with tier.
 */

export interface MatchMakerInput {
  studentId: string;
  request?: string;   // e.g. "add one more safety in-state"
}

export async function runMatchMaker(_input: MatchMakerInput) {
  throw new Error("not implemented");
}
