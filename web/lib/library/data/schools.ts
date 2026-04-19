/**
 * Curated school corpus.
 *
 * Hand-written from Wikipedia + each school's published CDS. We don't
 * try to be exhaustive — ~12 schools × ~6 facts each is enough for the
 * demo to feel real without turning this file into an encyclopedia.
 *
 * When adding a school:
 *   - Keep each fact ONE paragraph (~1-3 sentences).
 *   - Include a number when possible (admit rate, enrollment, endowment,
 *     middle-50 SAT). Numbers are what Match-Maker's hits look like.
 *   - Separate facts should cover DIFFERENT angles so different queries
 *     retrieve different chunks (admit rate, aid, student life,
 *     strengths, culture, outcomes).
 *
 * Data last reviewed: Apr 2026. Admit rates shift yearly — check each
 * school's latest CDS before a public demo.
 */

import type { SchoolRecord } from "../types";

export const SCHOOLS: readonly SchoolRecord[] = [
  {
    slug: "harvard",
    name: "Harvard University",
    context: "Private research university in Cambridge, Massachusetts. Ivy League.",
    tags: ["ivy league", "private", "research", "r1", "need-blind", "no-loans"],
    sourceUrl: "https://en.wikipedia.org/wiki/Harvard_University",
    facts: [
      "Harvard is a private Ivy League research university in Cambridge, Massachusetts, founded in 1636. Its undergraduate college enrolls about 7,200 students across Harvard Yard and the House system. The overall acceptance rate for the Class of 2028 was approximately 3.6%, one of the lowest in the United States.",
      "Harvard's financial aid is need-blind for all applicants (domestic and international) and meets 100% of demonstrated need with grants, not loans. Families earning under $85,000 pay nothing toward tuition, room, board, or fees. About 55% of undergraduates receive need-based grants; the average grant package is over $70,000.",
      "Middle-50% SAT range for admitted students is roughly 1500-1580; ACT 34-36. GPA distribution is top-heavy: around 97% of admitted students rank in the top 10% of their high school class. Harvard reinstated its SAT/ACT testing requirement for the Class of 2029.",
      "Strongest programs by reputation and research output include government, economics, history, biology, computer science, and the professional schools (Business, Law, Medicine, Public Health, Kennedy School). The faculty of Arts and Sciences houses most undergraduate instruction.",
      "Harvard's endowment was approximately $50 billion in 2024 — the largest of any university. Graduation rate for first-time full-time students is around 98% within six years. The alumni network is dense in law, finance, government, and academia.",
      "Student life centers on the 12 residential Houses — undergraduates are sorted into a House at the end of freshman year and remain affiliated through graduation. Extracurricular life is substantial: over 450 registered student organizations, Division I athletics (Ivy League), and an active network of final clubs and cultural societies.",
    ],
  },
  {
    slug: "yale",
    name: "Yale University",
    context: "Private research university in New Haven, Connecticut. Ivy League.",
    tags: ["ivy league", "private", "research", "r1", "need-blind", "no-loans"],
    sourceUrl: "https://en.wikipedia.org/wiki/Yale_University",
    facts: [
      "Yale is a private Ivy League research university in New Haven, Connecticut, chartered in 1701. Yale College enrolls about 6,600 undergraduates organized into 14 residential colleges. The Class of 2028 acceptance rate was approximately 3.7%.",
      "Yale is need-blind for all applicants and meets 100% of demonstrated financial need with grants and work-study (no loans required). Families earning under $75,000 have a $0 expected parent contribution. Yale's typical financial aid grant exceeds $65,000.",
      "Middle-50% SAT range is 1500-1580; ACT 33-35. Yale's admitted class is academically elite — roughly 95% of incoming students ranked in the top 10% of their high school class.",
      "Yale's strongest undergraduate programs include political science, economics, history, English, biology, and a very strong drama program (Yale School of Drama has deep crossover with undergraduate theater). The university is also well-known for its residential college system, modeled on Oxbridge.",
      "Yale's endowment is roughly $41 billion. Six-year graduation rate is approximately 97%. Alumni include five U.S. presidents and a heavy concentration of leaders in law, government, and the arts.",
      "Residential college life is the defining undergraduate experience — every student is assigned to one of 14 colleges that functions as a social, dining, and residential home for all four years. The system produces tight cross-class friendships and year-round college-vs-college intramurals.",
    ],
  },
  {
    slug: "princeton",
    name: "Princeton University",
    context: "Private research university in Princeton, New Jersey. Ivy League.",
    tags: ["ivy league", "private", "research", "r1", "need-blind", "no-loans"],
    sourceUrl: "https://en.wikipedia.org/wiki/Princeton_University",
    facts: [
      "Princeton is a private Ivy League research university in Princeton, New Jersey, founded in 1746. The undergraduate population is approximately 5,300 — the smallest of the Ivies. Acceptance rate for the Class of 2028 was approximately 4.5%.",
      "Princeton was the first U.S. university to go fully no-loan in its financial aid packages (2001). Aid is need-blind for all applicants including international students. Families earning under $100,000 typically pay nothing; families earning up to $200,000 receive significant grant aid. The average grant is over $65,000.",
      "Middle-50% SAT is 1510-1570; ACT 34-35. About 95% of admitted students rank in the top 10% of their graduating class. Princeton accepts either SAT or ACT; subject tests are optional.",
      "Princeton is distinctive for its strong focus on undergraduate teaching — there's no medical, law, or business school, so faculty orientation is toward undergrads. Strongest programs: mathematics, physics, economics, the Woodrow Wilson School (now SPIA) for public policy, engineering, and the humanities.",
      "Endowment is roughly $34 billion. Six-year graduation rate is 98%. The senior thesis — required of all A.B. candidates — is a signature undergraduate capstone. Eating clubs on Prospect Avenue are the main junior/senior social scene.",
      "Princeton's undergraduate focus means smaller class sizes than most Ivies — around 75% of classes have fewer than 20 students. Campus is a self-contained residential setting with most students living on-campus all four years.",
    ],
  },
  {
    slug: "stanford",
    name: "Stanford University",
    context: "Private research university in Stanford, California. Silicon Valley adjacent.",
    tags: ["private", "research", "r1", "need-blind", "no-loans", "stem", "silicon-valley"],
    sourceUrl: "https://en.wikipedia.org/wiki/Stanford_University",
    facts: [
      "Stanford is a private research university in Stanford, California, founded in 1885 by Leland and Jane Stanford. Undergraduate enrollment is approximately 7,800. The Class of 2028 acceptance rate was approximately 3.7%.",
      "Stanford is need-blind for domestic applicants and meets full demonstrated need with grants. Families earning under $100,000 pay nothing for tuition, room, or board; families under $150,000 pay no tuition. Average grant is over $60,000.",
      "Middle-50% SAT is 1500-1570; ACT 33-35. Stanford reinstated its testing requirement for the Class of 2029 (previously test-optional through the pandemic).",
      "Stanford is especially strong in computer science, engineering, biology, economics, and the School of Earth Sciences. Its Silicon Valley location produces an unmatched concentration of startup founders among alumni — Google, Cisco, Instagram, LinkedIn, and Netflix were all founded or co-founded by Stanford alumni.",
      "Endowment is approximately $36 billion. Six-year graduation rate is 96%. The undergraduate-to-faculty ratio is 5:1, and most courses have under 20 students.",
      "Residential life is organized around themed houses and co-ops; Stanford has no Greek life houses (fraternities/sororities exist but don't have their own buildings). The quarter system gives a faster pace than most peer schools.",
    ],
  },
  {
    slug: "mit",
    name: "Massachusetts Institute of Technology",
    context: "Private research university in Cambridge, Massachusetts. Highly STEM-focused.",
    tags: ["private", "research", "r1", "need-blind", "stem", "engineering", "top-ranked"],
    sourceUrl: "https://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology",
    facts: [
      "MIT is a private research university in Cambridge, Massachusetts, founded in 1861. Undergraduate enrollment is about 4,600, making it small for a top research university. Class of 2028 acceptance rate was approximately 4.5%.",
      "MIT is need-blind for all applicants (including international) and meets 100% of demonstrated need. Families earning under $100,000 are not expected to contribute toward tuition. The average need-based grant exceeds $60,000.",
      "Middle-50% SAT is 1510-1580; ACT 34-36. MIT has always required standardized testing and maintained that policy throughout the testing-optional era. It is one of the few top universities that publicly argues for testing as a fairness tool.",
      "MIT is overwhelmingly STEM-focused: the most popular majors are Course 6 (EECS — electrical engineering and computer science), Course 18 (math), and Course 2 (mechanical engineering). Even non-STEM concentrators take a serious core curriculum including calculus, physics, chemistry, and biology.",
      "Endowment is approximately $24 billion. Six-year graduation rate is 95%. MIT's UROP program (Undergraduate Research Opportunities) places more than 90% of undergrads in faculty-supervised research at some point in their degree.",
      "MIT's culture is famously hack- and problem-set-driven — students bond through late-night psets, the Independent Activities Period (IAP) in January, and an extensive hacking tradition. Athletics are Division III.",
    ],
  },
  {
    slug: "columbia",
    name: "Columbia University",
    context: "Private research university in New York City. Ivy League.",
    tags: ["ivy league", "private", "research", "r1", "need-blind", "no-loans", "urban"],
    sourceUrl: "https://en.wikipedia.org/wiki/Columbia_University",
    facts: [
      "Columbia is a private Ivy League research university in Morningside Heights, Manhattan, founded in 1754 as King's College. Undergraduate enrollment at Columbia College is about 4,700, plus 1,600 at Columbia Engineering. The Class of 2028 acceptance rate was approximately 3.9%.",
      "Columbia is need-blind for domestic applicants and meets full demonstrated need. It replaced loans with grants for families under $60,000 and significantly reduced loan expectations for higher incomes. Average Columbia grant exceeds $65,000.",
      "Middle-50% SAT is 1490-1570; ACT 34-35. Columbia remained test-optional longer than most peers and only recently announced a return to requiring standardized tests.",
      "Columbia's signature academic feature is the Core Curriculum — every undergraduate takes the same set of foundational courses in literature, philosophy, art, music, and science. Strong programs: economics, political science, international relations (SIPA), English, history, neuroscience, and engineering.",
      "Endowment is approximately $14 billion (smaller than most peer Ivies on a per-capita basis). Six-year graduation rate is 96%. New York City is effectively the extended campus — internships, cultural life, and research opportunities scale accordingly.",
      "Social life at Columbia is more dispersed than a rural campus — students navigate NYC and the tight campus in parallel. There's a Greek system, active performance arts scene, and serious club culture.",
    ],
  },
  {
    slug: "mit-alt-engineering", // intentionally separate: engineering-only prose
    name: "MIT (engineering focus)",
    context: "Engineering and computer science depth at MIT.",
    tags: ["engineering", "computer-science", "eecs", "research"],
    sourceUrl: "https://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology",
    facts: [
      "MIT's School of Engineering is consistently ranked the #1 engineering school in the United States. It comprises eight departments: Aeronautics and Astronautics, Biological Engineering, Chemical Engineering, Civil and Environmental Engineering, EECS (the largest), Materials Science, Mechanical Engineering, and Nuclear Science.",
      "Course 6 (EECS) is by far MIT's most popular major — roughly 30% of undergraduates major in it. The curriculum emphasizes both theory (algorithms, complexity, signals) and practice (systems, machine learning, robotics).",
      "MIT's Media Lab, Lincoln Laboratory, and CSAIL (Computer Science and Artificial Intelligence Laboratory) produce a disproportionate share of academic AI research. Many undergrads participate through UROP.",
    ],
  },
  {
    slug: "berkeley",
    name: "University of California, Berkeley",
    context: "Public research university in Berkeley, California. UC flagship.",
    tags: ["public", "uc", "research", "r1", "large", "stem", "liberal", "highly-selective"],
    sourceUrl: "https://en.wikipedia.org/wiki/University_of_California,_Berkeley",
    facts: [
      "UC Berkeley is a public research university in Berkeley, California, founded in 1868 as the UC system's flagship campus. Undergraduate enrollment is about 32,800. The Fall 2024 admit rate was approximately 12% overall — but by major it varies widely: engineering and CS are under 6%.",
      "Berkeley's in-state tuition and fees are approximately $17,000/year; total cost of attendance (in-state, on-campus) is around $45,000/year. Out-of-state tuition adds roughly $30,000/year. Berkeley uses the UC Application and does not accept the Common App.",
      "Berkeley's admissions evaluate in-context academic rigor (UC GPA capped at 4.4) and extensive essay responses (Personal Insight Questions). SAT/ACT are not used in admissions — the UC system went test-blind in 2021 and did not reverse that policy.",
      "Berkeley is particularly strong in computer science, engineering, economics, political science, the physical sciences, and molecular biology. The Haas School of Business admits juniors separately — direct freshman admission exists only for the Management, Entrepreneurship, and Technology (MET) program.",
      "Endowment is approximately $7.5 billion (shared UC system-wide). Six-year graduation rate is 91%. Berkeley's social/political culture is strongly progressive — free-speech movement heritage, active student activism, and a dense Bay Area internship market.",
      "Housing: Berkeley can only guarantee two years of on-campus housing. Many upperclassmen live in Berkeley's cooperative houses or off-campus apartments in the surrounding neighborhoods.",
    ],
  },
  {
    slug: "ucla",
    name: "University of California, Los Angeles",
    context: "Public research university in Los Angeles, California. UC.",
    tags: ["public", "uc", "research", "r1", "large", "comprehensive", "highly-selective"],
    sourceUrl: "https://en.wikipedia.org/wiki/University_of_California,_Los_Angeles",
    facts: [
      "UCLA is a public research university in Los Angeles, California, with undergraduate enrollment of approximately 32,400. Fall 2024 admit rate was roughly 9%, making it the most applied-to university in the United States (over 145,000 freshman applications).",
      "In-state tuition and fees are approximately $15,000/year; total cost of attendance in-state and on-campus is about $40,000/year. Non-residents add approximately $31,000 in additional tuition. UCLA uses the UC Application.",
      "UCLA is test-blind like the rest of the UC system. GPA (UC-capped at 4.4) and the Personal Insight Questions are the primary quantitative and qualitative signals. Admission is done at the UCLA level, but competitive majors (CS, Business Econ, Nursing) review applicants separately.",
      "UCLA is strongest in the life sciences, psychology, economics, political science, film (the School of Theater, Film, and Television is top-tier), and business economics. The medical school and dental school are both highly ranked.",
      "Six-year graduation rate is approximately 91%. UCLA's location in Westwood provides easy access to Los Angeles's entertainment and tech industries, and its endowment is around $6.5 billion.",
      "Student life revolves around a large campus (over 400 acres in Westwood), Greek life, and the ~1,000+ student organizations. Division I athletics (Pac-12 successor conference) are a significant part of campus culture.",
    ],
  },
  {
    slug: "michigan",
    name: "University of Michigan (Ann Arbor)",
    context: "Public research university in Ann Arbor, Michigan.",
    tags: ["public", "big-ten", "research", "r1", "large", "comprehensive"],
    sourceUrl: "https://en.wikipedia.org/wiki/University_of_Michigan",
    facts: [
      "The University of Michigan is a public research university in Ann Arbor, founded in 1817. Undergraduate enrollment is approximately 33,000. Admit rate for the Class of 2028 was approximately 18% overall; in-state applicants have significantly higher acceptance rates (~40%) than out-of-state (~15%).",
      "In-state tuition and fees are approximately $17,000/year; out-of-state is approximately $58,000/year before aid. Michigan offers the Go Blue Guarantee — free tuition for in-state families under $75,000 income.",
      "Michigan is test-optional. Middle-50% SAT for admitted students is 1360-1530; ACT 31-34. The admitted class is largely in the top 10% of their graduating high school class.",
      "Michigan is particularly strong in engineering (College of Engineering is top-10 nationally), business (Ross School, direct admission competitive), computer science, kinesiology, and the School of Music, Theatre, and Dance. Michigan Medicine is highly ranked.",
      "Endowment is approximately $18 billion. Six-year graduation rate is 93%. Michigan is a Big Ten school with major-college football (The Big House holds 107,000).",
      "Campus is divided between Central Campus (humanities/social sciences/business) and North Campus (engineering/music/art). Ann Arbor is a classic college town — dense, walkable, and built around the university.",
    ],
  },
  {
    slug: "ut-austin",
    name: "University of Texas at Austin",
    context: "Public research university in Austin, Texas.",
    tags: ["public", "big-12", "research", "r1", "large", "comprehensive"],
    sourceUrl: "https://en.wikipedia.org/wiki/University_of_Texas_at_Austin",
    facts: [
      "UT Austin is a public research university in Austin, Texas, founded in 1883 as the flagship of the UT System. Undergraduate enrollment is approximately 41,000. Admit rate is roughly 31% overall but varies wildly by major — Computer Science admit rate is under 5%.",
      "Texas residents graduating in the top 6% of their Texas high school class are guaranteed automatic admission under the state's top-percent law (currently top 6% for UT Austin specifically; other Texas schools use top 10%). This system means the majority of in-state admits arrive via automatic admission.",
      "In-state tuition and fees are approximately $12,000/year; out-of-state is approximately $43,000/year. Texas Advance Commitment covers full tuition for families earning under $100,000 (and partial for families under $125,000).",
      "UT is test-optional. Middle-50% SAT is 1240-1470; ACT 27-34. The admitted class has a wide academic profile because of auto-admits.",
      "UT's strongest programs: engineering (Cockrell School), computer science (highly competitive), business (McCombs), communications (Moody), and the natural sciences. Architecture, education, and law are also well-regarded.",
      "Endowment (via the Permanent University Fund) is large — UT Austin's share is roughly $30 billion, shared with the Texas A&M System. Six-year graduation rate is 89%. Austin's tech and creative-industry job market is a major part of UT's value proposition.",
    ],
  },
  {
    slug: "rice",
    name: "Rice University",
    context: "Private research university in Houston, Texas.",
    tags: ["private", "research", "r1", "small", "stem", "need-blind", "hidden-gem"],
    sourceUrl: "https://en.wikipedia.org/wiki/Rice_University",
    facts: [
      "Rice is a private research university in Houston, Texas, founded in 1912. Undergraduate enrollment is approximately 4,600 — unusually small for a top research university. The Class of 2028 acceptance rate was approximately 7.5%.",
      "Rice is need-blind for domestic applicants and meets full demonstrated need. The Rice Investment (for families earning under $200,000) covers full tuition; families under $75,000 pay nothing for tuition, room, or board. Average grant exceeds $55,000.",
      "Middle-50% SAT is 1510-1570; ACT 34-36. About 90% of the admitted class was in the top 10% of their high school.",
      "Rice is particularly strong in engineering, computer science, cognitive sciences, and the natural sciences. The Shepherd School of Music is top-tier. Rice's student-to-faculty ratio is 6:1 — one of the lowest in the country.",
      "Endowment is approximately $8 billion — exceptionally large on a per-student basis. Six-year graduation rate is 94%.",
      "Rice's residential college system (11 colleges) is one of its defining features — students are sorted into a college before matriculation and remain affiliated for all four years, similar to Yale's system but smaller and more tightly-knit.",
    ],
  },
  {
    slug: "georgia-tech",
    name: "Georgia Institute of Technology",
    context: "Public research university in Atlanta, Georgia. STEM-focused.",
    tags: ["public", "research", "r1", "stem", "engineering", "computer-science"],
    sourceUrl: "https://en.wikipedia.org/wiki/Georgia_Institute_of_Technology",
    facts: [
      "Georgia Tech is a public research university in Atlanta, Georgia, founded in 1885. Undergraduate enrollment is approximately 18,500. Admit rate is approximately 16% overall — under 12% for out-of-state applicants.",
      "In-state tuition and fees are approximately $13,000/year; out-of-state is approximately $34,000/year. Georgia residents with HOPE or Zell Miller scholarships (state merit aid) see tuition effectively halved or eliminated.",
      "Georgia Tech is test-optional but ~90% of admits submit scores. Middle-50% SAT is 1410-1540; ACT 31-35. Like many STEM-heavy schools, academic rigor (especially math) weighs heavily.",
      "Georgia Tech is especially strong in engineering (top-5 nationally — biomedical, industrial, civil, mechanical, and aerospace are all highly ranked), computer science, and business (Scheller). Its co-op program places undergraduates in paid industry positions for 3 to 5 semesters.",
      "Endowment is approximately $3 billion. Six-year graduation rate is 93%. Georgia Tech's Atlanta location provides significant internship access with local tech and media employers (Delta, Coca-Cola, CNN, major tech offices).",
      "Tech's academic culture is intense — the grading curve is well-known for being brutal, and the six-year graduation rate (not four-year) is often cited because engineering degrees commonly take longer than four years.",
    ],
  },
  {
    slug: "pomona",
    name: "Pomona College",
    context: "Liberal arts college in Claremont, California. Part of the 5Cs.",
    tags: ["private", "liberal-arts", "lac", "small", "need-blind", "no-loans", "top-lac"],
    sourceUrl: "https://en.wikipedia.org/wiki/Pomona_College",
    facts: [
      "Pomona College is a private liberal arts college in Claremont, California, founded in 1887. Undergraduate enrollment is approximately 1,700. Pomona is the founding member of the Claremont Colleges (the 5Cs) consortium. Class of 2028 acceptance rate was approximately 7%.",
      "Pomona is need-blind for all applicants (domestic and international), meets 100% of demonstrated need, and replaced loans with grants in 2008. Families earning under $75,000 pay nothing; the average grant is around $60,000.",
      "Middle-50% SAT is 1440-1550; ACT 32-35. Pomona is test-optional. Admitted class is strongly top-of-class — roughly 91% of admits from high schools that rank were in the top 10%.",
      "Pomona is a pure liberal arts college — no engineering, business, nursing, or pre-professional programs. Strongest departments: economics, politics, computer science, biology, chemistry, English, and the arts. Through the 5C consortium, students can take courses across all five Claremont Colleges.",
      "Endowment is approximately $3 billion — exceptionally high for a college of 1,700 students. Six-year graduation rate is approximately 94%. Student-to-faculty ratio is 7:1.",
      "Student life is residential — over 98% of students live on campus all four years. Athletic teams (the Sagehens) compete in NCAA Division III as part of a Pomona-Pitzer joint program.",
    ],
  },
];
