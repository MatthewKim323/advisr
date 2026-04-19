/**
 * Scout seed URLs.
 *
 * Scout answers "what scholarships can I actually get." Its domain
 * allowlist is:
 *    scholarships.com, goingmerry.com, fastweb.com, careeronestop.org
 *
 * Strategy is different from Match-Maker/Bursar: scholarships live in
 * DIRECTORIES, not profile pages. The value is the LIST, not one page.
 * So we set `maxPages` much higher — we want HD to walk the category
 * pages and pull in individual award listings.
 *
 * Careful with:
 *   - fastweb.com: mostly auth-walled. Their public category pages work
 *     but deeper links push you into a signup flow. Keep maxPages low.
 *   - scholarships.com: their /scholarship-directory/ tree is crawlable
 *     but sprawling. Point at specific category roots (e.g.
 *     /scholarship-directory/major/computer-science) to stay focused.
 *   - careeronestop.org: federal Department of Labor. Stable, clean
 *     markup. Slowly-updated. Good canonical source.
 *   - goingmerry.com: mostly behind sign-up but their public landing
 *     pages have useful category descriptions.
 *
 * I'm keeping this list short deliberately — 8 well-chosen roots > 50
 * scattershot URLs. We can broaden after we see what quality comes back.
 */

import type { SeedEntry } from "./types.mjs";

export const SCOUT_SEEDS: readonly SeedEntry[] = [
  // ── CareerOneStop (gold standard, federal, stable) ──
  {
    url: "https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx",
    maxPages: 20,
    name: "scout/careeronestop-root",
    note: "lets HD walk into category/demographic facets",
  },

  // ── scholarships.com category directories ──
  // Each root covers a distinct student slice. maxPages: 15 = the root +
  // ~14 listings per category; cheap and covers the top awards in each.
  {
    url: "https://www.scholarships.com/financial-aid/college-scholarships/scholarships-by-major/",
    maxPages: 15,
    name: "scout/sc-by-major",
  },
  {
    url: "https://www.scholarships.com/financial-aid/college-scholarships/scholarships-by-type/",
    maxPages: 15,
    name: "scout/sc-by-type",
  },
  {
    url: "https://www.scholarships.com/financial-aid/college-scholarships/scholarships-by-grade-level/high-school-scholarships/",
    maxPages: 15,
    name: "scout/sc-high-school",
  },
  {
    url: "https://www.scholarships.com/financial-aid/college-scholarships/scholarships-by-minority/",
    maxPages: 15,
    name: "scout/sc-by-minority",
  },

  // ── goingmerry (public-facing pages only) ──
  {
    url: "https://www.goingmerry.com/scholarships",
    maxPages: 10,
    name: "scout/goingmerry-directory",
    note: "some pages push signup — crawl may be thin",
  },

  // ── fastweb (public categories) ──
  {
    url: "https://www.fastweb.com/college-scholarships",
    maxPages: 8,
    name: "scout/fastweb-root",
    note: "auth-wall risk, keep shallow",
  },
];
