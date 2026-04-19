/**
 * Quick debug script — runs a raw HD search (no filters) and dumps whatever
 * the library returns. Used when a "real" specialist search comes back empty
 * and we need to see if HD actually indexed anything useful.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const API_KEY = process.env.HUMANDELTA_API_KEY!;
const BASE_URL = process.env.HUMANDELTA_BASE_URL ?? "https://api.humandelta.ai";

// NB: we deliberately skip `hd.search()` — the 0.1.x SDK doesn't unwrap
// `{ results: [...] }` and silently returns []. Hit REST directly.
const query = process.argv.slice(2).join(" ") || "harvard acceptance rate";
console.log(`\nquery: ${query}\n`);

const r = await fetch(`${BASE_URL}/v1/search`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query, top_k: 10 }),
});
if (!r.ok) {
  console.error(`✗ ${r.status}: ${(await r.text()).slice(0, 200)}`);
  process.exit(1);
}
const json = (await r.json()) as {
  results?: Array<{
    score: number;
    text: string;
    source_type: string;
    source_url: string;
  }>;
};
const hits = json.results ?? [];
for (const h of hits) {
  console.log(`${h.score.toFixed(3)}  ${h.source_type}  ${h.source_url.slice(0, 70)}`);
  console.log(`  "${h.text.slice(0, 140).replace(/\s+/g, " ")}…"`);
  console.log();
}
console.log(`(${hits.length} hits)\n`);
