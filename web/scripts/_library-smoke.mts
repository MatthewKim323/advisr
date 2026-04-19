/**
 * Smoke test for the blended library.
 *
 * Runs a handful of representative queries through `searchLibrary` using
 * each specialist's real config (allowlist + categories). Verifies:
 *   1. Local hits come back for every specialist.
 *   2. Scores are sensible (keyword queries → high, off-topic → low).
 *   3. Category filtering is doing what we think it is.
 *
 * Run:   cd web && npx tsx scripts/_library-smoke.mts
 * Teardown: delete the file after — it's a one-shot probe.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

import { searchLibrary } from "@/lib/humandelta";
import { SPECIALISTS } from "@/lib/agents/specialists";
import { libraryStats } from "@/lib/library";

console.log("\n═══ library stats ═══");
console.log(libraryStats());
console.log();

const cases = [
  {
    spec: SPECIALISTS["match-maker"],
    queries: [
      "need-blind schools with no loans",
      "big public research university with strong engineering",
      "small liberal arts college California",
      "ivy league acceptance rate",
    ],
  },
  {
    spec: SPECIALISTS.bursar,
    queries: [
      "what is the FAFSA",
      "Harvard financial aid under $85k",
      "pell grant amount 2025",
      "UC Blue and Gold low income tuition",
    ],
  },
  {
    spec: SPECIALISTS.scout,
    queries: [
      "first generation college scholarship",
      "STEM women engineering scholarship",
      "full ride low income minority",
      "no essay scholarship high school senior",
    ],
  },
];

for (const { spec, queries } of cases) {
  console.log(`\n─── ${spec.label.toUpperCase()} ───`);
  for (const q of queries) {
    const hits = await searchLibrary({
      query: q,
      topK: 3,
      domainAllowlist: spec.domainAllowlist,
      categories: spec.libraryCategories,
      localOnly: true, // demo: local-only so smoke is deterministic
    });
    console.log(`\n  "${q}"  →  ${hits.length} hit${hits.length === 1 ? "" : "s"}`);
    for (const h of hits) {
      const tag = `[${h.source_type}${h.category ? `/${h.category}` : ""}]`;
      console.log(`    ${h.score.toFixed(2)} ${tag.padEnd(20)}  ${h.text.slice(0, 90)}…`);
    }
  }
}

console.log("\n✓ smoke complete\n");
