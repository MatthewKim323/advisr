/**
 * Canonical deadline table.
 *
 * Two kinds of entries:
 *   1. "universal" — applies to every senior regardless of school
 *      (FAFSA opens, FAFSA priority, CSS opens, Decision Day).
 *   2. per-school — keyed on a normalized school slug (see `normalizeSchool`).
 *      Only a curated set of high-volume schools for the demo; for anything
 *      else we tell the student honestly "I don't have this school's specific
 *      dates — check their admissions page."
 *
 * Dates are intentionally month-day tuples (`monthDay(mm, dd)`), NOT calendar
 * years. Pacer resolves each to an actual date relative to the student's
 * graduation year at query time. That way the table stays accurate forever:
 * a 2027 grad and a 2028 grad both read the same "Nov 1 EA" row.
 *
 * Sources: each school's admissions page (verified manually, not scraped).
 * If a school shifts a deadline, edit the entry here and it updates for
 * everyone immediately. Deliberate: hackathon-scale manual correctness
 * beats a live scraper that breaks every time a CMS re-lays out.
 */

export type PacerCategory =
  | "application"
  | "financial"
  | "testing"
  | "essay"
  | "scholarship"
  | "decision";

export interface DeadlineEntry {
  id: string; // stable slug, used as React keys and graph claim IDs later
  title: string;
  month: number; // 1-12
  day: number;
  category: PacerCategory;
  /** School slug OR "universal". */
  scope: string;
  /** One-line explainer Pacer includes so Dean can pass it through if useful. */
  note?: string;
  /** Deadline "round" — lets us filter e.g. "show me all ED deadlines". */
  round?: "EA" | "ED" | "REA" | "RD" | "priority" | "final" | null;
  /** Relative to which calendar year in the senior's cycle:
   *    "fall"   → the fall calendar year of senior year (Sep-Dec)
   *    "spring" → the spring calendar year of senior year (Jan-Aug = same as grad year)
   *  Used when resolving month/day into an absolute Date. */
  cycleYear: "fall" | "spring";
}

// ──────────────────────────────────────────────────────────────────────
// UNIVERSAL deadlines — every senior, regardless of school
// ──────────────────────────────────────────────────────────────────────

export const UNIVERSAL_DEADLINES: readonly DeadlineEntry[] = [
  {
    id: "fafsa-opens",
    title: "FAFSA opens",
    month: 10,
    day: 1,
    category: "financial",
    scope: "universal",
    cycleYear: "fall",
    note: "Federal aid form. Submit ASAP — many state & institutional dollars are first-come first-served.",
  },
  {
    id: "css-opens",
    title: "CSS Profile opens",
    month: 10,
    day: 1,
    category: "financial",
    scope: "universal",
    cycleYear: "fall",
    note: "Non-federal aid form. Required by ~250 mostly private schools.",
  },
  {
    id: "fafsa-federal-final",
    title: "FAFSA federal deadline",
    month: 6,
    day: 30,
    category: "financial",
    scope: "universal",
    cycleYear: "spring",
    note: "Truly final federal cut-off. States / schools usually close earlier.",
  },
  {
    id: "decision-day",
    title: "National Decision Day (deposit due)",
    month: 5,
    day: 1,
    category: "decision",
    scope: "universal",
    cycleYear: "spring",
    note: "Enrollment deposit at ONE school. Declining others is a real step.",
  },
  {
    id: "ap-exams",
    title: "AP exams begin",
    month: 5,
    day: 5, // rough — first full week of May
    category: "testing",
    scope: "universal",
    cycleYear: "spring",
    note: "If taking APs: confirm your exam center by March.",
  },
] as const;

// ──────────────────────────────────────────────────────────────────────
// PER-SCHOOL deadlines — curated for demo schools
// ──────────────────────────────────────────────────────────────────────

export const SCHOOL_DEADLINES: readonly DeadlineEntry[] = [
  // ── UC system (system-wide app, one deadline for all campuses) ──
  {
    id: "uc-rd",
    title: "UC application (all 9 campuses)",
    month: 11,
    day: 30,
    category: "application",
    scope: "university-of-california",
    cycleYear: "fall",
    round: "RD",
    note: "One application covers every UC. There's no ED/EA — just this one date.",
  },

  // ── Cal State system ──
  {
    id: "csu-priority",
    title: "Cal State application priority filing",
    month: 11,
    day: 30,
    category: "application",
    scope: "cal-state",
    cycleYear: "fall",
    round: "priority",
    note: "Some CSUs stay open past this — check specific campus.",
  },

  // ── Ivies + peers (standard ED/RD pattern) ──
  {
    id: "harvard-rea",
    title: "Harvard REA",
    month: 11,
    day: 1,
    category: "application",
    scope: "harvard",
    cycleYear: "fall",
    round: "REA",
  },
  {
    id: "harvard-rd",
    title: "Harvard RD",
    month: 1,
    day: 1,
    category: "application",
    scope: "harvard",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "yale-rea",
    title: "Yale REA",
    month: 11,
    day: 1,
    category: "application",
    scope: "yale",
    cycleYear: "fall",
    round: "REA",
  },
  {
    id: "yale-rd",
    title: "Yale RD",
    month: 1,
    day: 2,
    category: "application",
    scope: "yale",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "princeton-rea",
    title: "Princeton REA",
    month: 11,
    day: 1,
    category: "application",
    scope: "princeton",
    cycleYear: "fall",
    round: "REA",
  },
  {
    id: "princeton-rd",
    title: "Princeton RD",
    month: 1,
    day: 1,
    category: "application",
    scope: "princeton",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "stanford-rea",
    title: "Stanford REA",
    month: 11,
    day: 1,
    category: "application",
    scope: "stanford",
    cycleYear: "fall",
    round: "REA",
  },
  {
    id: "stanford-rd",
    title: "Stanford RD",
    month: 1,
    day: 5,
    category: "application",
    scope: "stanford",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "mit-ea",
    title: "MIT EA",
    month: 11,
    day: 1,
    category: "application",
    scope: "mit",
    cycleYear: "fall",
    round: "EA",
  },
  {
    id: "mit-rd",
    title: "MIT RD",
    month: 1,
    day: 5,
    category: "application",
    scope: "mit",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "columbia-ed",
    title: "Columbia ED",
    month: 11,
    day: 1,
    category: "application",
    scope: "columbia",
    cycleYear: "fall",
    round: "ED",
  },
  {
    id: "columbia-rd",
    title: "Columbia RD",
    month: 1,
    day: 1,
    category: "application",
    scope: "columbia",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "penn-ed",
    title: "UPenn ED",
    month: 11,
    day: 1,
    category: "application",
    scope: "penn",
    cycleYear: "fall",
    round: "ED",
  },
  {
    id: "penn-rd",
    title: "UPenn RD",
    month: 1,
    day: 5,
    category: "application",
    scope: "penn",
    cycleYear: "spring",
    round: "RD",
  },

  // ── Top publics with well-known dates ──
  {
    id: "michigan-ea",
    title: "University of Michigan EA",
    month: 11,
    day: 1,
    category: "application",
    scope: "michigan",
    cycleYear: "fall",
    round: "EA",
  },
  {
    id: "michigan-rd",
    title: "University of Michigan RD",
    month: 2,
    day: 1,
    category: "application",
    scope: "michigan",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "uva-ed",
    title: "UVA ED",
    month: 11,
    day: 1,
    category: "application",
    scope: "uva",
    cycleYear: "fall",
    round: "ED",
  },
  {
    id: "uva-ea",
    title: "UVA EA",
    month: 11,
    day: 1,
    category: "application",
    scope: "uva",
    cycleYear: "fall",
    round: "EA",
  },
  {
    id: "uva-rd",
    title: "UVA RD",
    month: 1,
    day: 5,
    category: "application",
    scope: "uva",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "unc-ea",
    title: "UNC EA",
    month: 10,
    day: 15,
    category: "application",
    scope: "unc",
    cycleYear: "fall",
    round: "EA",
  },
  {
    id: "unc-rd",
    title: "UNC RD",
    month: 1,
    day: 15,
    category: "application",
    scope: "unc",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "gatech-ea1",
    title: "Georgia Tech EA Round 1 (GA residents)",
    month: 10,
    day: 15,
    category: "application",
    scope: "georgia-tech",
    cycleYear: "fall",
    round: "EA",
  },
  {
    id: "gatech-ea2",
    title: "Georgia Tech EA Round 2 (non-residents)",
    month: 11,
    day: 1,
    category: "application",
    scope: "georgia-tech",
    cycleYear: "fall",
    round: "EA",
  },
  {
    id: "gatech-rd",
    title: "Georgia Tech RD",
    month: 1,
    day: 4,
    category: "application",
    scope: "georgia-tech",
    cycleYear: "spring",
    round: "RD",
  },
  {
    id: "ut-priority",
    title: "UT Austin priority",
    month: 12,
    day: 1,
    category: "application",
    scope: "ut-austin",
    cycleYear: "fall",
    round: "priority",
  },
  {
    id: "ut-final",
    title: "UT Austin final",
    month: 2,
    day: 1,
    category: "application",
    scope: "ut-austin",
    cycleYear: "spring",
    round: "final",
  },
] as const;

// ──────────────────────────────────────────────────────────────────────
// School-name normalization
// ──────────────────────────────────────────────────────────────────────

/** Collapse a free-form school name to a slug used in `scope`.
 *
 *  Matches a pragmatic subset — the demo's curated schools plus common
 *  aliases ("cal" → berkeley, "HYP" isn't one but "harvard" is, etc.). Any
 *  unknown name returns its normalized slug, which won't match any entry —
 *  caller treats that as "unknown school." */
export function normalizeSchool(raw: string): string {
  const s = raw.trim().toLowerCase();

  // Hand-maintained aliases. Keep ordered — first match wins.
  const aliases: Array<[RegExp, string]> = [
    [/^uc[\s-]?(berkeley|b)\b|^cal\b|^berkeley\b/, "university-of-california"],
    [/^uc[\s-]?(la|l\.a\.)\b|^ucla\b/, "university-of-california"],
    [/^uc[\s-]?(san\s?diego|sd)\b|^ucsd\b/, "university-of-california"],
    [/^uc[\s-]?(irvine|i)\b|^uci\b/, "university-of-california"],
    [/^uc[\s-]?(davis|d)\b|^ucd\b/, "university-of-california"],
    [/^uc[\s-]?(santa\s?barbara|sb)\b|^ucsb\b/, "university-of-california"],
    [/^uc[\s-]?(santa\s?cruz|sc)\b|^ucsc\b/, "university-of-california"],
    [/^uc[\s-]?(riverside|r)\b|^ucr\b/, "university-of-california"],
    [/^uc[\s-]?(merced|m)\b/, "university-of-california"],
    [/^university of california\b/, "university-of-california"],
    [/\bcsu\b|\bcal state\b/, "cal-state"],
    [/\bharvard\b/, "harvard"],
    [/\byale\b/, "yale"],
    [/\bprinceton\b/, "princeton"],
    [/\bstanford\b/, "stanford"],
    [/\bmit\b|\bmassachusetts institute\b/, "mit"],
    [/\bcolumbia\b/, "columbia"],
    [/\bupenn\b|\bu\.?penn\b|\bpenn\b|\bpennsylvania\b/, "penn"],
    [/\bmichigan\b|\bumich\b/, "michigan"],
    [/\buva\b|\bvirginia\b/, "uva"],
    [/\bunc\b|\bnorth carolina\b|\bchapel hill\b/, "unc"],
    [/\bgeorgia tech\b|\bgatech\b|\bgt\b/, "georgia-tech"],
    [/\but austin\b|\butexas\b|\but-austin\b|\buniversity of texas\b/, "ut-austin"],
  ];

  for (const [re, slug] of aliases) if (re.test(s)) return slug;

  // No match — return a normalized-ish slug so the caller can report it back
  // verbatim ("I don't have deadlines for X") without fabricating.
  return s.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Pretty name for display — reverse-lookup from a slug to the canonical
 *  name we'd show the student. Falls back to Title-Casing the slug. */
export function prettySchool(slug: string): string {
  const map: Record<string, string> = {
    "university-of-california": "UC system",
    "cal-state": "Cal State",
    "harvard": "Harvard",
    "yale": "Yale",
    "princeton": "Princeton",
    "stanford": "Stanford",
    "mit": "MIT",
    "columbia": "Columbia",
    "penn": "UPenn",
    "michigan": "U. Michigan",
    "uva": "UVA",
    "unc": "UNC",
    "georgia-tech": "Georgia Tech",
    "ut-austin": "UT Austin",
  };
  if (map[slug]) return map[slug];
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
