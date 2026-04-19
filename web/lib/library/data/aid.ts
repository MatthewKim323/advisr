/**
 * Financial aid corpus — Bursar's library.
 *
 * Two categories mixed together:
 *   1. School-specific aid policies (e.g. Harvard's under-$85k rule).
 *      These drive cost-comparison answers.
 *   2. Universal / federal context (FAFSA, Pell, loans, EFC/SAI).
 *      These anchor the student in "what does this actually mean."
 *
 * Source links are real — Bursar cites the underlying page so students
 * can verify. Numbers refreshed Apr 2026; check each school's aid page
 * before a high-stakes demo.
 */

import type { AidRecord } from "../types";

export const AID: readonly AidRecord[] = [
  // ── Universal / federal ─────────────────────────────────────────────
  {
    slug: "fafsa-overview",
    title: "FAFSA — what it is and why it matters",
    tags: ["fafsa", "federal", "universal", "application"],
    sourceUrl: "https://studentaid.gov/apply-for-aid/fafsa",
    text: "The FAFSA (Free Application for Federal Student Aid) is the form every college student applying for need-based aid must submit. It collects income and asset information to compute the Student Aid Index (SAI, formerly EFC — Expected Family Contribution) which colleges use to determine aid packages. The 2025-26 FAFSA opens October 1, 2025. File it as close to that date as possible — many state and school aid programs are first-come, first-served.",
  },
  {
    slug: "fafsa-sai-explainer",
    title: "Student Aid Index (SAI) — the new EFC",
    tags: ["fafsa", "sai", "efc", "federal"],
    sourceUrl: "https://studentaid.gov/h/understand-aid/how-calculated",
    text: "The SAI (Student Aid Index) replaced the EFC (Expected Family Contribution) in the 2024-25 FAFSA. A student's SAI can now go as low as -1,500 (previous minimum was 0), which can make more students eligible for Pell Grants and other need-based aid. SAI is computed from parent and student income, assets, family size, and the number of family members in college.",
  },
  {
    slug: "css-profile",
    title: "CSS Profile — what it adds to FAFSA",
    tags: ["css", "profile", "private-school", "application"],
    sourceUrl: "https://cssprofile.collegeboard.org/",
    text: "The CSS Profile is an additional financial aid form used by about 240 colleges — primarily private, highly-selective schools. It asks more detailed questions than the FAFSA (home equity, small-business income, divorced-parent income, medical expenses) to give schools a more complete financial picture. If you're applying to Ivies, top privates, or need-blind institutions, you almost always need the CSS Profile in addition to FAFSA.",
  },
  {
    slug: "pell-grant",
    title: "Federal Pell Grant",
    tags: ["federal", "grant", "pell", "need-based"],
    sourceUrl: "https://studentaid.gov/understand-aid/types/grants/pell",
    text: "The Pell Grant is the largest federal need-based grant program. For 2025-26, the maximum Pell Grant is $7,395 per year. Students with a Student Aid Index (SAI) at or below a certain threshold qualify. Unlike loans, Pell does not need to be repaid. You file for Pell via the FAFSA — no separate application.",
  },
  {
    slug: "direct-loans",
    title: "Federal Direct Loans — subsidized vs unsubsidized",
    tags: ["federal", "loan", "debt", "direct-loan"],
    sourceUrl: "https://studentaid.gov/understand-aid/types/loans",
    text: "Federal Direct Subsidized Loans are need-based and the government pays the interest while you're in school. Direct Unsubsidized Loans are available regardless of need but interest accrues while you're enrolled. Dependent undergraduate students can borrow up to $5,500/year as freshmen (with a max of $3,500 subsidized) and $27,000 total over their undergraduate career. Rates change annually — for 2025-26, undergraduate Direct Loans are at 6.53%.",
  },
  {
    slug: "work-study",
    title: "Federal Work-Study — what it actually is",
    tags: ["federal", "work-study", "employment"],
    sourceUrl: "https://studentaid.gov/understand-aid/types/work-study",
    text: "Federal Work-Study provides part-time jobs for undergraduate students with financial need, allowing them to earn money to help pay education expenses. Pay is at least federal minimum wage; earnings are not included in the following year's FAFSA income (they don't penalize you). Work-study is ALLOCATED by the school as part of your aid package — if you're not offered it, you can often request it.",
  },
  {
    slug: "net-price-calc",
    title: "Net Price Calculators — use before applying",
    tags: ["universal", "cost", "npc", "tool"],
    sourceUrl: "https://collegescorecard.ed.gov/",
    text: "Every college that receives federal aid is required by law to publish a Net Price Calculator (NPC) on its website. The NPC takes your family's income and asset data and estimates what you'd actually pay after institutional aid. Use it BEFORE the application — a school's sticker price often has little to do with your actual cost. NPC estimates aren't binding but are typically within a few thousand dollars of actual offers.",
  },

  // ── School-specific aid policies ───────────────────────────────────
  {
    slug: "harvard-aid-policy",
    school: "harvard",
    title: "Harvard — tuition-free under $85k, need-blind",
    tags: ["harvard", "no-loans", "need-blind", "grant-only"],
    sourceUrl: "https://college.harvard.edu/financial-aid",
    text: "Harvard is need-blind for all applicants including international students. It meets 100% of demonstrated financial need with grants (no loans required). Families earning under $85,000 per year pay NOTHING toward tuition, room, board, or fees — a full ride. Families earning up to $150,000 typically pay 0-10% of income. About 55% of undergraduates receive need-based aid; the average grant exceeds $70,000/year.",
  },
  {
    slug: "yale-aid-policy",
    school: "yale",
    title: "Yale — $0 parent contribution under $75k",
    tags: ["yale", "no-loans", "need-blind"],
    sourceUrl: "https://finaid.yale.edu/",
    text: "Yale is need-blind for all applicants and meets 100% of demonstrated financial need. Yale does not include loans in its aid packages — all aid is either grants or work-study. Families earning under $75,000 with typical assets have a $0 parent contribution; families under $200,000 typically receive substantial aid. The average Yale financial aid grant is approximately $65,000 per year.",
  },
  {
    slug: "princeton-aid-policy",
    school: "princeton",
    title: "Princeton — first fully no-loan school (2001)",
    tags: ["princeton", "no-loans", "need-blind", "grant-only"],
    sourceUrl: "https://admission.princeton.edu/cost-aid",
    text: "Princeton was the first U.S. university to eliminate loans from all its financial aid packages (2001). It is need-blind for ALL applicants including international students. Families earning under $100,000 pay nothing; families earning up to $200,000 receive substantial grant aid. Princeton's average scholarship grant covers 100% of tuition plus most or all of room and board.",
  },
  {
    slug: "stanford-aid-policy",
    school: "stanford",
    title: "Stanford — tuition-free under $150k",
    tags: ["stanford", "no-loans", "grant-only"],
    sourceUrl: "https://admission.stanford.edu/afford/",
    text: "Stanford is need-blind for domestic applicants (need-aware for international) and meets 100% of demonstrated need for all admitted students. Families with incomes below $100,000 typically pay nothing for tuition, room, or board. Families below $150,000 pay no tuition. Stanford does not require loans in its aid packages — financial aid is grant-based.",
  },
  {
    slug: "mit-aid-policy",
    school: "mit",
    title: "MIT — need-blind including internationals",
    tags: ["mit", "need-blind", "international"],
    sourceUrl: "https://sfs.mit.edu/",
    text: "MIT is one of a small number of U.S. universities that is need-blind for ALL applicants including international students. It meets 100% of demonstrated financial need. Families earning under $100,000/year are not expected to contribute toward tuition. About 59% of MIT undergrads receive need-based aid. Loans are not required as part of the aid package.",
  },
  {
    slug: "columbia-aid-policy",
    school: "columbia",
    title: "Columbia — loan-free for families under $60k",
    tags: ["columbia", "need-blind", "no-loans-low-income"],
    sourceUrl: "https://undergrad.admissions.columbia.edu/afford",
    text: "Columbia is need-blind for domestic applicants and meets 100% of demonstrated financial need. For families earning under $60,000 with typical assets, all loans are replaced with grants. For higher-income families, loan expectations are capped. Average Columbia grant exceeds $65,000; the university spends over $190 million annually on undergraduate financial aid.",
  },
  {
    slug: "rice-investment",
    school: "rice",
    title: "Rice Investment — full tuition under $200k income",
    tags: ["rice", "merit-plus-need", "tiered"],
    sourceUrl: "https://financialaid.rice.edu/undergraduate/the-rice-investment",
    text: "The Rice Investment is a tiered aid commitment: families earning under $75,000 pay nothing for tuition, room, board, or fees; families earning $75,000-$140,000 receive grants covering full tuition; families earning $140,000-$200,000 receive grants covering half of tuition. This replaces the standard need-based approach with a predictable income-based scale.",
  },
  {
    slug: "pomona-aid-policy",
    school: "pomona",
    title: "Pomona — need-blind, all-grant, no loans since 2008",
    tags: ["pomona", "no-loans", "need-blind", "grant-only"],
    sourceUrl: "https://www.pomona.edu/admissions/financial-aid",
    text: "Pomona College is need-blind for all applicants (domestic and international) and has been fully no-loan since 2008 — every student's package is met with grants and, occasionally, work-study. Families earning under $75,000 have a $0 parent contribution and receive grants covering full cost of attendance. Average grant exceeds $60,000/year.",
  },
  {
    slug: "uc-blue-gold",
    title: "UC Blue and Gold Opportunity Plan — free tuition under $80k income",
    school: "berkeley",
    tags: ["uc", "blue-gold", "berkeley", "ucla", "california", "in-state"],
    sourceUrl: "https://admission.universityofcalifornia.edu/tuition-financial-aid/",
    text: "California residents attending a UC campus (Berkeley, UCLA, etc.) with family income under $80,000 and typical assets will have their UC system-wide tuition and fees covered by grants through the Blue and Gold Opportunity Plan. This does NOT cover room and board, but combined with Cal Grant and Pell most eligible students see most of their cost of attendance covered.",
  },
  {
    slug: "michigan-go-blue",
    title: "Michigan — Go Blue Guarantee (in-state tuition-free under $75k)",
    school: "michigan",
    tags: ["michigan", "in-state", "tuition-free-low-income"],
    sourceUrl: "https://finaid.umich.edu/go-blue-guarantee/",
    text: "The Go Blue Guarantee provides free tuition for four years to eligible in-state students from families earning $75,000 or less with typical assets. Michigan residents meeting these criteria pay $0 for tuition — room, board, and fees are a separate calculation and may still have costs. There is no separate application; you file the FAFSA and Michigan's standard financial aid forms.",
  },
  {
    slug: "texas-advance-commitment",
    title: "UT Austin — Texas Advance Commitment",
    school: "ut-austin",
    tags: ["ut-austin", "in-state", "texas", "tuition-free"],
    sourceUrl: "https://onestop.utexas.edu/managing-costs/cost-of-attendance/",
    text: "Texas Advance Commitment covers full tuition for Texas residents with annual family income of $100,000 or less. Families with income up to $125,000 receive partial tuition assistance. The program is automatic for admitted Texas residents — file FAFSA and TASFA to qualify. Room, board, and fees still have associated costs.",
  },
  {
    slug: "appeal-aid-offer",
    title: "Appealing a financial aid offer — when and how",
    tags: ["appeal", "aid-offer", "universal"],
    sourceUrl: "https://studentaid.gov/help/appeal-fafsa",
    text: "Financial aid offers aren't final. Most schools have a formal appeal (or 'professional judgment') process where a family can request review if circumstances have changed since filing FAFSA — job loss, medical expenses, divorce, unusual one-time income. Appeal strength depends on documented CHANGE in circumstances, not 'we wish we got more.' Better-resourced schools (especially meets-full-need privates) have more room to adjust.",
  },
];
