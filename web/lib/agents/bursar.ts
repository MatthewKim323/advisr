/**
 * Bursar — The Financial Aid Advisor.
 *
 * Calculates true cost at each school. Runs school Net Price Calculators
 * in PARALLEL (this is the demo-gold visual — 5 browsers at once).
 * Normalizes aid offers (grant vs. disguised loan).
 * Writes `true_cost_at`, `aid_offer_from` claims.
 *
 * Killer line: "Five schools. Five financial aid offices. Twelve seconds."
 */

export interface BursarInput {
  studentId: string;
  schools: string[];   // entity names or IDs — target set from Match-Maker
}

export async function runBursar(_input: BursarInput) {
  // TODO: Promise.all(schools.map(s => browse({ task: `run NPC for ${s}`, ... })))
  //       each spawn emits its own events so the canvas can open 5 laptops.
  throw new Error("not implemented");
}
