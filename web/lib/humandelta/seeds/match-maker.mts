/**
 * Match-Maker seed URLs.
 *
 * Match-Maker answers "what schools should I apply to / am I a reach for X."
 * Its domain allowlist is:
 *   wikipedia.org, collegescorecard.ed.gov, niche.com, ipeds.ed.gov,
 *   commondataset.org
 *
 * Source strategy (learned the hard way during seeding):
 *
 *   - **Wikipedia** is the workhorse. Its school articles are dense, server-
 *     rendered HTML; HD chunks them cleanly and semantic search returns
 *     high-signal results (admit rates, student body, notable programs, aid
 *     policies, rankings). This is now our primary source.
 *   - **Niche** profile pages render most of their content with JavaScript.
 *     The crawler mostly indexes cookie banners + sponsored-link boilerplate.
 *     We keep a handful of Niche profiles as secondary signal — occasionally
 *     they expose a "student review" snippet that does pass through.
 *   - **College Scorecard** is more API than web. Skipping for now; we can
 *     wire the Scorecard JSON endpoint directly if we want authoritative
 *     admit/outcome data.
 *
 * Naming convention: `match-maker/<school-slug>` (e.g. `match-maker/harvard`).
 * If you add the same school from multiple sources, suffix with the source:
 *   `match-maker/harvard-wiki`, `match-maker/harvard-niche`.
 */

import type { SeedEntry } from "./types.mjs";

export const MATCH_MAKER_SEEDS: readonly SeedEntry[] = [
  // ── Wikipedia (primary source) ──────────────────────────────────────
  // Big-name privates
  { url: "https://en.wikipedia.org/wiki/Harvard_University",        maxPages: 3, name: "match-maker/harvard-wiki" },
  { url: "https://en.wikipedia.org/wiki/Yale_University",           maxPages: 3, name: "match-maker/yale-wiki" },
  { url: "https://en.wikipedia.org/wiki/Princeton_University",      maxPages: 3, name: "match-maker/princeton-wiki" },
  { url: "https://en.wikipedia.org/wiki/Stanford_University",       maxPages: 3, name: "match-maker/stanford-wiki" },
  { url: "https://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology",
                                                                    maxPages: 3, name: "match-maker/mit-wiki" },
  { url: "https://en.wikipedia.org/wiki/Columbia_University",       maxPages: 3, name: "match-maker/columbia-wiki" },
  { url: "https://en.wikipedia.org/wiki/University_of_Pennsylvania",maxPages: 3, name: "match-maker/penn-wiki" },
  { url: "https://en.wikipedia.org/wiki/Brown_University",          maxPages: 3, name: "match-maker/brown-wiki" },
  { url: "https://en.wikipedia.org/wiki/Dartmouth_College",         maxPages: 3, name: "match-maker/dartmouth-wiki" },
  { url: "https://en.wikipedia.org/wiki/Cornell_University",        maxPages: 3, name: "match-maker/cornell-wiki" },
  { url: "https://en.wikipedia.org/wiki/Duke_University",           maxPages: 3, name: "match-maker/duke-wiki" },
  { url: "https://en.wikipedia.org/wiki/Northwestern_University",   maxPages: 3, name: "match-maker/northwestern-wiki" },

  // Top publics
  { url: "https://en.wikipedia.org/wiki/University_of_California,_Los_Angeles",
                                                                    maxPages: 3, name: "match-maker/ucla-wiki" },
  { url: "https://en.wikipedia.org/wiki/University_of_California,_Berkeley",
                                                                    maxPages: 3, name: "match-maker/berkeley-wiki" },
  { url: "https://en.wikipedia.org/wiki/University_of_California,_San_Diego",
                                                                    maxPages: 3, name: "match-maker/ucsd-wiki",   note: "data science / HDSI destination" },
  { url: "https://datascience.ucsd.edu/",                           maxPages: 2, name: "match-maker/ucsd-hdsi",   note: "HDSI program page — BS Data Science specifics" },
  // UC system — full coverage so Match-Maker can answer "best UC for <major>"
  { url: "https://en.wikipedia.org/wiki/University_of_California,_Santa_Barbara",
                                                                    maxPages: 3, name: "match-maker/ucsb-wiki",   note: "physics, materials science, marine bio" },
  { url: "https://en.wikipedia.org/wiki/University_of_California,_Davis",
                                                                    maxPages: 3, name: "match-maker/ucd-wiki",    note: "#1 ag/vet school in the world" },
  { url: "https://en.wikipedia.org/wiki/University_of_California,_Irvine",
                                                                    maxPages: 3, name: "match-maker/uci-wiki",    note: "standalone ICS school, HSI, social mobility" },
  { url: "https://en.wikipedia.org/wiki/University_of_California,_Santa_Cruz",
                                                                    maxPages: 3, name: "match-maker/ucsc-wiki",   note: "astronomy, game design" },
  { url: "https://en.wikipedia.org/wiki/University_of_California,_Riverside",
                                                                    maxPages: 3, name: "match-maker/ucr-wiki",    note: "HSI, entomology, creative writing, direct-admit business" },
  { url: "https://en.wikipedia.org/wiki/University_of_California,_Merced",
                                                                    maxPages: 3, name: "match-maker/ucm-wiki",    note: "newest UC, first-gen majority" },
  { url: "https://admission.universityofcalifornia.edu/",           maxPages: 3, name: "match-maker/uc-admissions", note: "system-wide admissions policy, Blue and Gold, test-blind" },

  { url: "https://en.wikipedia.org/wiki/University_of_Michigan",    maxPages: 3, name: "match-maker/michigan-wiki" },
  { url: "https://en.wikipedia.org/wiki/University_of_Virginia",    maxPages: 3, name: "match-maker/uva-wiki" },
  { url: "https://en.wikipedia.org/wiki/University_of_North_Carolina_at_Chapel_Hill",
                                                                    maxPages: 3, name: "match-maker/unc-wiki" },
  { url: "https://en.wikipedia.org/wiki/Georgia_Institute_of_Technology",
                                                                    maxPages: 3, name: "match-maker/gt-wiki" },
  { url: "https://en.wikipedia.org/wiki/University_of_Texas_at_Austin",
                                                                    maxPages: 3, name: "match-maker/ut-austin-wiki" },

  // Mid-tier targets / safeties
  { url: "https://en.wikipedia.org/wiki/Purdue_University",         maxPages: 3, name: "match-maker/purdue-wiki" },
  { url: "https://en.wikipedia.org/wiki/Ohio_State_University",     maxPages: 3, name: "match-maker/ohio-state-wiki" },
  { url: "https://en.wikipedia.org/wiki/University_of_Wisconsin%E2%80%93Madison",
                                                                    maxPages: 3, name: "match-maker/wisconsin-wiki" },
  { url: "https://en.wikipedia.org/wiki/Florida_State_University",  maxPages: 3, name: "match-maker/fsu-wiki" },
  { url: "https://en.wikipedia.org/wiki/Arizona_State_University",  maxPages: 3, name: "match-maker/asu-wiki" },

  // California State University system — primary "likely/target" pool for
  // California residents, first-gen, and HSI-seeking students. CSUF is
  // Maria's natural target school given her OC residency + demographics.
  { url: "https://en.wikipedia.org/wiki/California_State_University,_Fullerton",
                                                                    maxPages: 3, name: "match-maker/csuf-wiki", note: "HSI, largest CSU, Maria's backyard" },

  // Hidden-gem / value picks
  { url: "https://en.wikipedia.org/wiki/Rice_University",            maxPages: 3, name: "match-maker/rice-wiki",      note: "strong value, small size" },
  { url: "https://en.wikipedia.org/wiki/Vanderbilt_University",      maxPages: 3, name: "match-maker/vanderbilt-wiki" },
  { url: "https://en.wikipedia.org/wiki/Grinnell_College",           maxPages: 3, name: "match-maker/grinnell-wiki",  note: "LAC, need-blind" },
  { url: "https://en.wikipedia.org/wiki/Pomona_College",             maxPages: 3, name: "match-maker/pomona-wiki",    note: "top LAC" },
  { url: "https://en.wikipedia.org/wiki/Swarthmore_College",         maxPages: 3, name: "match-maker/swarthmore-wiki", note: "top LAC" },
  { url: "https://en.wikipedia.org/wiki/Williams_College",           maxPages: 3, name: "match-maker/williams-wiki",   note: "top LAC" },
  { url: "https://en.wikipedia.org/wiki/Amherst_College",            maxPages: 3, name: "match-maker/amherst-wiki",    note: "top LAC" },

  // ── Niche (secondary, lower signal) ─────────────────────────────────
  // Kept as supplemental signal. The crawls still sometimes surface student
  // reviews and rank snippets that Wikipedia doesn't cover. Shallow (maxPages:1)
  // since most of the page is boilerplate.
  { url: "https://www.niche.com/colleges/harvard-university/",      maxPages: 1, name: "match-maker/harvard" },
  { url: "https://www.niche.com/colleges/yale-university/",         maxPages: 1, name: "match-maker/yale" },
  { url: "https://www.niche.com/colleges/stanford-university/",     maxPages: 1, name: "match-maker/stanford" },
];
