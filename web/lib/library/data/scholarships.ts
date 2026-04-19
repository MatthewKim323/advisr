/**
 * Scholarship corpus — Scout's library.
 *
 * A mix of national, well-known awards (Gates, Coca-Cola) plus
 * category-driven picks (STEM, first-gen, underrepresented minority,
 * specific majors) so Scout has something to say regardless of the
 * student's profile.
 *
 * All amounts are in USD. Deadlines are approximate / typical — real
 * deadlines shift every cycle; Scout should ALWAYS tell the student to
 * verify the current deadline on the sponsor's site before applying.
 *
 * Refreshed Apr 2026. Urgent review before demo: deadlines + amounts.
 */

import type { ScholarshipRecord } from "../types";

export const SCHOLARSHIPS: readonly ScholarshipRecord[] = [
  // ── Mega-prestige, big dollars ──────────────────────────────────────
  {
    slug: "gates-scholarship",
    name: "The Gates Scholarship",
    amount: 75000, // ~full cost of attendance × 4 years, funded by Gates Foundation
    deadline: "mid-September",
    eligibility:
      "High-achieving, Pell-eligible minority high school seniors (African American, American Indian/Alaska Native, Asian & Pacific Islander, or Hispanic American) planning to enroll in college full-time as freshmen.",
    tags: ["minority", "pell", "first-gen", "full-ride", "gates", "need-based", "national"],
    sourceUrl: "https://www.thegatesscholarship.org/",
  },
  {
    slug: "coca-cola-scholars",
    name: "Coca-Cola Scholars Program",
    amount: 20000,
    deadline: "October 31",
    eligibility:
      "High school seniors in the U.S. who have demonstrated leadership, academic achievement, and community impact. Open regardless of major or planned college. ~150 scholars selected annually.",
    tags: ["leadership", "community", "merit", "coca-cola", "national", "competitive"],
    sourceUrl: "https://www.coca-colascholarsfoundation.org/",
  },
  {
    slug: "jack-kent-cooke",
    name: "Jack Kent Cooke Foundation College Scholarship",
    amount: 55000,
    deadline: "mid-November",
    eligibility:
      "High-performing high school seniors with financial need (family income typically under $95,000). Renewable up to $55,000/year for up to four years toward a four-year degree.",
    tags: ["need-based", "high-achieving", "merit-plus-need", "jkc", "national"],
    sourceUrl: "https://www.jkcf.org/our-scholarships/college-scholarship-program/",
  },
  {
    slug: "questbridge-national-match",
    name: "QuestBridge National College Match",
    amount: 300000, // four years full ride at partner schools
    deadline: "late September",
    eligibility:
      "High-achieving high school seniors from low-income backgrounds (typical family income under $65,000 for a family of four). Match provides a full 4-year scholarship to a QuestBridge partner college (includes most Ivies, Stanford, MIT, Rice, Pomona, and others).",
    tags: ["low-income", "first-gen", "match", "full-ride", "questbridge", "ivy", "national"],
    sourceUrl: "https://www.questbridge.org/high-school-students/national-college-match",
  },
  {
    slug: "ron-brown-scholar",
    name: "Ron Brown Scholar Program",
    amount: 40000, // $10k/year × 4 years
    deadline: "January 9 (early deadline) / March 1",
    eligibility:
      "African American high school seniors with demonstrated leadership, academic achievement, financial need, and a commitment to public service.",
    tags: ["african-american", "minority", "leadership", "public-service", "national"],
    sourceUrl: "https://www.ronbrown.org/",
  },

  // ── STEM / major-specific ───────────────────────────────────────────
  {
    slug: "goldwater-scholarship",
    name: "Barry Goldwater Scholarship",
    amount: 7500,
    deadline: "late January (nominated by college)",
    eligibility:
      "College sophomores and juniors pursuing research careers in natural sciences, engineering, or mathematics. Must be nominated by your college — not a direct application. U.S. citizens/permanent residents/nationals.",
    tags: ["stem", "research", "college-student", "undergraduate", "goldwater", "national"],
    sourceUrl: "https://goldwaterscholarship.gov/",
  },
  {
    slug: "scholarships-for-women-stem",
    name: "Society of Women Engineers Scholarship",
    amount: 15000,
    deadline: "February 15 (sophomore+) / May 1 (freshmen)",
    eligibility:
      "Women majoring in ABET-accredited engineering, engineering technology, or computer science programs. Over 260 individual scholarships in the SWE pool — one application matches you to all.",
    tags: ["women", "stem", "engineering", "swe", "college-student"],
    sourceUrl: "https://swe.org/scholarships/",
  },
  {
    slug: "davidson-fellows",
    name: "Davidson Fellows Scholarship",
    amount: 50000,
    deadline: "mid-February",
    eligibility:
      "Students 18 or younger who have completed significant research or innovative project in STEM, literature, music, philosophy, or \"outside the box.\" Requires documentation of the project. Highly competitive; very few winners annually.",
    tags: ["stem", "research", "high-school", "gifted", "davidson", "highly-competitive"],
    sourceUrl: "https://www.davidsongifted.org/gifted-programs/fellowship-scholarship/",
  },
  {
    slug: "posse-scholarship",
    name: "Posse Foundation Scholarship",
    amount: 240000, // four-year full tuition at partner schools
    deadline: "nominated in early September",
    eligibility:
      "High school seniors nominated by their high school or community organization, selected for leadership potential. Posse sends students to partner colleges in \"posses\" of 10. Leadership and team-dynamics matter more than raw GPA.",
    tags: ["leadership", "team", "full-tuition", "posse", "nomination-required", "national"],
    sourceUrl: "https://www.possefoundation.org/",
  },

  // ── First-generation / need-based ──────────────────────────────────
  {
    slug: "dell-scholars",
    name: "Dell Scholars Program",
    amount: 20000,
    deadline: "early December",
    eligibility:
      "High school seniors with a GPA of 2.4+, demonstrated grit and self-motivation, and financial need (Pell-eligible is the strong signal). Dell emphasizes 'GPA is a floor, not a ceiling' — grit and obstacle-overcoming matter more.",
    tags: ["grit", "first-gen", "need-based", "dell", "pell", "national"],
    sourceUrl: "https://www.dellscholars.org/",
  },
  {
    slug: "horatio-alger",
    name: "Horatio Alger National Scholarship",
    amount: 25000,
    deadline: "October 25",
    eligibility:
      "High school seniors who have faced and overcome significant adversity, with strong commitment to pursuing a bachelor's degree. Financial need (family income typically under $65,000) required. The adversity essay is the central application component.",
    tags: ["adversity", "need-based", "first-gen", "horatio-alger", "national"],
    sourceUrl: "https://scholars.horatioalger.org/",
  },
  {
    slug: "cooke-young-scholars",
    name: "Jack Kent Cooke Young Scholars Program",
    amount: 50000, // in-kind: 8th grade through high school support
    deadline: "late April (for current 7th graders)",
    eligibility:
      "Current 7th-grade students with strong academic achievement, financial need (income typically under $95,000), and demonstrated motivation. Provides academic and college-prep support through high school; NOT a cash-out scholarship.",
    tags: ["middle-school", "seventh-grade", "need-based", "jkc", "long-term"],
    sourceUrl: "https://www.jkcf.org/our-scholarships/young-scholars-program/",
  },

  // ── Broadly accessible / lower-competition ─────────────────────────
  {
    slug: "niche-no-essay",
    name: 'Niche "No Essay" Scholarship',
    amount: 2000,
    deadline: "monthly rolling",
    eligibility:
      "Any U.S. high school, college, or graduate student. No essay, no GPA requirement — a drawing. Low amount but extremely low effort; worth applying if you're already using Niche.",
    tags: ["no-essay", "low-effort", "monthly", "niche", "accessible"],
    sourceUrl: "https://www.niche.com/colleges/scholarship/",
  },
  {
    slug: "fastweb-match",
    name: "Fastweb matched scholarships",
    amount: 5000,
    deadline: "varies (many rolling)",
    eligibility:
      "Not a single scholarship — Fastweb is a matching tool. Build a detailed profile (demographics, major, interests, activities) and it returns a personalized list of scholarships you qualify for. Average student matches with 50+ opportunities.",
    tags: ["matching-tool", "varied", "fastweb", "volume"],
    sourceUrl: "https://www.fastweb.com/",
  },
  {
    slug: "careeronestop-scholarshipfinder",
    name: "CareerOneStop Scholarship Finder (federal)",
    amount: 10000, // representative
    deadline: "varies",
    eligibility:
      "Not a single scholarship. CareerOneStop is a federal Department of Labor database with over 9,000 scholarships, fellowships, and grants — filterable by state, major, level of study, and affiliation. Authoritative and spam-free; excellent starting point.",
    tags: ["database", "federal", "careeronestop", "filterable", "comprehensive"],
    sourceUrl: "https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx",
  },
  {
    slug: "hispanic-scholarship-fund",
    name: "Hispanic Scholarship Fund",
    amount: 5000,
    deadline: "mid-February",
    eligibility:
      "Students of Hispanic heritage with a 3.0+ high school GPA or 2.5+ college GPA, enrolled full-time at a U.S. accredited school. One application connects you to 30+ HSF scholarship programs.",
    tags: ["hispanic", "latino", "minority", "hsf", "national"],
    sourceUrl: "https://www.hsf.net/scholarship",
  },
  {
    slug: "united-negro-college-fund",
    name: "UNCF (United Negro College Fund) Scholarships",
    amount: 5000, // typical; ranges widely
    deadline: "varies",
    eligibility:
      "Open to Black/African American students with a 2.5+ GPA, U.S. citizenship, and demonstrated financial need. UNCF administers more than 350 scholarship programs with varied eligibility — one UNCF account gives access to all.",
    tags: ["african-american", "minority", "uncf", "varied", "national"],
    sourceUrl: "https://scholarships.uncf.org/",
  },
  {
    slug: "apia-scholars",
    name: "APIA (Asian & Pacific Islander American) Scholars",
    amount: 5000,
    deadline: "early January",
    eligibility:
      "U.S. citizens, nationals, or permanent residents of Asian and/or Pacific Islander heritage, enrolling or currently enrolled as an undergraduate at an accredited U.S. institution. Financial need preferred but not required.",
    tags: ["asian", "pacific-islander", "apia", "minority", "national"],
    sourceUrl: "https://apiascholars.org/",
  },
];
