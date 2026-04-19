/**
 * Match-Maker seed URLs.
 *
 * Match-Maker answers "what schools should I apply to / am I a reach for X."
 * Its domain allowlist is:
 *    collegescorecard.ed.gov, niche.com, ipeds.ed.gov, commondataset.org
 *
 * Strategy for the hackathon:
 *   - One Niche profile per school on the student's likely radar (~15 schools).
 *     These pages are dense with exactly what Match-Maker needs: admit rate,
 *     SAT/ACT ranges, acceptance by major, demographic breakdown.
 *   - A handful of broader Niche index pages ("Best Colleges in California",
 *     "Best Value Colleges") so Match-Maker can surface hidden gems it
 *     wouldn't find just from the 15 specific profiles.
 *   - College Scorecard is an API more than a web surface — their institution
 *     pages are noisy HTML wrappers around the same data. Skipping for now;
 *     we can wire the Scorecard JSON API directly later if needed.
 *
 * Adding a school: copy an existing `niche.com/colleges/<slug>/` row and
 * change the slug. Niche uses kebab-case; find the slug by visiting the
 * profile in a browser.
 */

import type { SeedEntry } from "./types.mjs";

export const MATCH_MAKER_SEEDS: readonly SeedEntry[] = [
  // ── Big-name privates ──
  { url: "https://www.niche.com/colleges/harvard-university/", maxPages: 1, name: "match-maker/harvard" },
  { url: "https://www.niche.com/colleges/yale-university/", maxPages: 1, name: "match-maker/yale" },
  { url: "https://www.niche.com/colleges/princeton-university/", maxPages: 1, name: "match-maker/princeton" },
  { url: "https://www.niche.com/colleges/stanford-university/", maxPages: 1, name: "match-maker/stanford" },
  { url: "https://www.niche.com/colleges/massachusetts-institute-of-technology/", maxPages: 1, name: "match-maker/mit" },
  { url: "https://www.niche.com/colleges/columbia-university/", maxPages: 1, name: "match-maker/columbia" },
  { url: "https://www.niche.com/colleges/university-of-pennsylvania/", maxPages: 1, name: "match-maker/penn" },

  // ── Top publics ──
  { url: "https://www.niche.com/colleges/university-of-california-los-angeles/", maxPages: 1, name: "match-maker/ucla" },
  { url: "https://www.niche.com/colleges/university-of-california-berkeley/", maxPages: 1, name: "match-maker/uc-berkeley" },
  { url: "https://www.niche.com/colleges/university-of-michigan-ann-arbor/", maxPages: 1, name: "match-maker/michigan" },
  { url: "https://www.niche.com/colleges/university-of-virginia/", maxPages: 1, name: "match-maker/uva" },
  { url: "https://www.niche.com/colleges/university-of-north-carolina-at-chapel-hill/", maxPages: 1, name: "match-maker/unc" },
  { url: "https://www.niche.com/colleges/georgia-institute-of-technology/", maxPages: 1, name: "match-maker/georgia-tech" },
  { url: "https://www.niche.com/colleges/university-of-texas-austin/", maxPages: 1, name: "match-maker/ut-austin" },

  // ── Mid-tier targets / safeties (helps match-maker build tiered lists) ──
  { url: "https://www.niche.com/colleges/purdue-university-main-campus/", maxPages: 1, name: "match-maker/purdue" },
  { url: "https://www.niche.com/colleges/ohio-state-university/", maxPages: 1, name: "match-maker/ohio-state" },
  { url: "https://www.niche.com/colleges/university-of-wisconsin/", maxPages: 1, name: "match-maker/wisconsin" },
  { url: "https://www.niche.com/colleges/florida-state-university/", maxPages: 1, name: "match-maker/fsu" },
  { url: "https://www.niche.com/colleges/arizona-state-university/", maxPages: 1, name: "match-maker/asu" },

  // ── Hidden-gem / value picks ──
  // These help Match-Maker go beyond the obvious name-brand schools.
  { url: "https://www.niche.com/colleges/rice-university/", maxPages: 1, name: "match-maker/rice", note: "strong value, small size" },
  { url: "https://www.niche.com/colleges/vanderbilt-university/", maxPages: 1, name: "match-maker/vanderbilt" },
  { url: "https://www.niche.com/colleges/grinnell-college/", maxPages: 1, name: "match-maker/grinnell", note: "LAC, need-blind" },
  { url: "https://www.niche.com/colleges/pomona-college/", maxPages: 1, name: "match-maker/pomona", note: "top LAC" },
];
