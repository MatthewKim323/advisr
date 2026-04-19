/**
 * Bursar seed URLs.
 *
 * Bursar answers "can I afford this / what will X actually cost." Its
 * domain allowlist is:
 *    studentaid.gov, collegescorecard.ed.gov, commondataset.org, .edu
 *
 * Strategy:
 *   1. A couple of studentaid.gov hubs — canonical FAFSA + federal aid
 *      context. These pages are stable and dense.
 *   2. One financial-aid landing per target school. These .edu pages
 *      usually link to the school's NPC, aid policies, typical aid-by-
 *      income band. maxPages: 3 lets HD follow one or two hops into the
 *      FAQ / policy sub-pages.
 *   3. A few high-value policy pages (Harvard's no-tuition-under-$85k,
 *      Princeton's no-loans) — these are decision-driving facts the student
 *      will NEVER get from a generic admissions tour.
 *
 * We skip the actual Net Price Calculators — they're interactive forms,
 * not crawlable. The student has to run those themselves (future: a
 * "walk me through the NPC" feature for Bursar).
 */

import type { SeedEntry } from "./types.mjs";

export const BURSAR_SEEDS: readonly SeedEntry[] = [
  // ── Federal aid context (studentaid.gov) ──
  { url: "https://studentaid.gov/apply-for-aid/fafsa", maxPages: 5, name: "bursar/studentaid-fafsa" },
  { url: "https://studentaid.gov/understand-aid/types", maxPages: 5, name: "bursar/studentaid-types" },
  { url: "https://studentaid.gov/understand-aid/eligibility", maxPages: 3, name: "bursar/studentaid-eligibility" },

  // ── Target school aid landings (.edu) ──
  // maxPages: 3 so HD can follow one hop into policy/FAQ sub-pages.
  { url: "https://financialaid.harvard.edu/", maxPages: 4, name: "bursar/harvard-aid", note: "no tuition < $85k policy" },
  { url: "https://finaid.yale.edu/", maxPages: 4, name: "bursar/yale-aid" },
  { url: "https://admission.princeton.edu/cost-aid", maxPages: 4, name: "bursar/princeton-aid", note: "no-loan policy" },
  { url: "https://admission.stanford.edu/afford/", maxPages: 4, name: "bursar/stanford-aid" },
  { url: "https://sfs.mit.edu/undergraduate-students/the-cost-of-attendance/", maxPages: 4, name: "bursar/mit-aid" },
  { url: "https://www.cc.columbia.edu/financialaid/", maxPages: 4, name: "bursar/columbia-aid" },
  { url: "https://www.sfs.upenn.edu/undergraduate/", maxPages: 4, name: "bursar/penn-aid" },

  // Publics — sticker price matters a lot more here, especially out-of-state
  { url: "https://financialaid.ucla.edu/types-of-aid", maxPages: 4, name: "bursar/ucla-aid" },
  { url: "https://financialaid.berkeley.edu/", maxPages: 4, name: "bursar/berkeley-aid" },
  { url: "https://finaid.umich.edu/types-of-aid/", maxPages: 4, name: "bursar/michigan-aid" },
  { url: "https://sfs.virginia.edu/undergrad", maxPages: 4, name: "bursar/uva-aid" },
  { url: "https://studentaid.unc.edu/types-of-aid/", maxPages: 4, name: "bursar/unc-aid" },
  { url: "https://finaid.gatech.edu/types-of-aid/", maxPages: 4, name: "bursar/gt-aid" },
  { url: "https://onestop.utexas.edu/managing-costs/cost-of-attendance/", maxPages: 4, name: "bursar/ut-aid" },

  // ── Broad context pieces ──
  // Helps Bursar answer "why is my EFC so high" kind of questions.
  { url: "https://studentaid.gov/h/understand-aid/expected-family-contribution", maxPages: 2, name: "bursar/efc-explainer", note: "may 404; skip if stale" },
];
