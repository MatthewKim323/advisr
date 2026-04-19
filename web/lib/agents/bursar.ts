/**
 * Bursar — The Financial Aid Advisor.
 *
 * Estimates the true cost at each school after aid. Distinguishes grants
 * from disguised loans. Writes `true_cost_at`, `aid_offer_from` claims.
 *
 * === Retrieval model (revised) ===
 *
 * We index school NPC pages, CDS PDFs, and aid-office FAQs into Human Delta
 * up front (per-school categories, e.g. `aid/berkeley`, `aid/columbia`).
 * At query time Bursar runs a parallel hd.search() against each school's
 * library and synthesizes. No live browser-use required — keeps the demo
 * deterministic and fast. See lib/agents/specialists.ts for the new shape.
 *
 * Killer line (updated): "Five schools. Five library queries. Two seconds."
 */

export interface BursarInput {
  studentId: string;
  schools: string[];
}

export async function runBursar(_input: BursarInput) {
  // TODO:
  //   Promise.all(schools.map(s => searchLibrary({
  //     category: `aid/${normalize(s)}`,
  //     query: "net price estimated cost of attendance for a student with ..."
  //   })))
  //   Each search emits tool_call_started/finished so the canvas lights up
  //   5 sonar pings simultaneously — the new demo-gold visual.
  throw new Error("not implemented");
}
