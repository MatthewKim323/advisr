/**
 * Quick debug script — runs a raw HD search (no filters) and dumps whatever
 * the library returns. Used when a "real" specialist search comes back empty
 * and we need to see if HD actually indexed anything useful.
 */

import { config as loadEnv } from "dotenv";
import { HumanDelta } from "humandelta";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const hd = new HumanDelta({
  apiKey: process.env.HUMANDELTA_API_KEY!,
  baseUrl: process.env.HUMANDELTA_BASE_URL ?? "https://api.humandelta.ai",
});

const query = process.argv.slice(2).join(" ") || "harvard acceptance rate";
console.log(`\nquery: ${query}\n`);

const hits = await hd.search(query, 10);
for (const h of hits) {
  console.log(`${h.score.toFixed(3)}  ${h.source_type}  ${h.source_url.slice(0, 70)}`);
  console.log(`  "${h.text.slice(0, 140).replace(/\s+/g, " ")}…"`);
  console.log();
}
console.log(`(${hits.length} hits)\n`);
