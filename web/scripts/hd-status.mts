/**
 * Report current state of every Human Delta index job on this API key.
 *
 * Usage:
 *   npx tsx scripts/hd-status.ts                 # all jobs, grouped by specialist
 *   npx tsx scripts/hd-status.ts match-maker     # just one specialist's jobs
 *   npx tsx scripts/hd-status.ts --failed        # only failed jobs
 *
 * Grouping is done on the `name` prefix — seed scripts format names as
 * `<specialist>/<slug>` so we can parse them back out. Anything without a
 * slash lands in an "uncategorized" bucket (e.g. Archivist's student-file
 * uploads, which don't have a specialist prefix).
 */

import { config as loadEnv } from "dotenv";
import { HumanDelta } from "humandelta";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const API_KEY = process.env.HUMANDELTA_API_KEY;
const BASE_URL = process.env.HUMANDELTA_BASE_URL ?? "https://api.humandelta.ai";

if (!API_KEY || !API_KEY.startsWith("hd_live_")) {
  console.error("✗ HUMANDELTA_API_KEY missing / malformed in web/.env.local");
  process.exit(1);
}

const hd = new HumanDelta({ apiKey: API_KEY, baseUrl: BASE_URL });

const tty = process.stdout.isTTY;
const c = {
  dim: (s: string) => (tty ? `\x1b[2m${s}\x1b[0m` : s),
  green: (s: string) => (tty ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s: string) => (tty ? `\x1b[33m${s}\x1b[0m` : s),
  red: (s: string) => (tty ? `\x1b[31m${s}\x1b[0m` : s),
  cyan: (s: string) => (tty ? `\x1b[36m${s}\x1b[0m` : s),
  bold: (s: string) => (tty ? `\x1b[1m${s}\x1b[0m` : s),
};

function colorStatus(status: string): string {
  if (status === "done" || status === "completed") return c.green(status);
  if (status === "running" || status === "queued") return c.yellow(status);
  if (status === "failed" || status === "cancelled") return c.red(status);
  return status;
}

async function main() {
  const argv = process.argv.slice(2);
  const onlyFailed = argv.includes("--failed");
  const filterPrefix = argv.find((a) => !a.startsWith("--"));

  const jobs = await hd.indexes.list({ limit: 500 });
  const visible = jobs.filter((j) => {
    if (onlyFailed && !(j.status === "failed" || j.status === "cancelled")) {
      return false;
    }
    if (filterPrefix && !j.name.startsWith(`${filterPrefix}/`)) {
      return false;
    }
    return true;
  });

  if (visible.length === 0) {
    console.log(c.dim("no jobs match."));
    return;
  }

  // Group by the prefix before the first slash.
  const groups = new Map<string, typeof visible>();
  for (const j of visible) {
    const key = j.name.includes("/") ? j.name.split("/")[0]! : "uncategorized";
    const g = groups.get(key) ?? [];
    g.push(j);
    groups.set(key, g);
  }

  // Consistent, readable order.
  const keyOrder = ["match-maker", "bursar", "scout", "archivist", "uncategorized"];
  const sortedKeys = [
    ...keyOrder.filter((k) => groups.has(k)),
    ...Array.from(groups.keys()).filter((k) => !keyOrder.includes(k)),
  ];

  console.log(c.bold(`\n▸ Human Delta indexes  (${jobs.length} total)\n`));

  for (const key of sortedKeys) {
    const rows = groups.get(key)!;
    const counts = rows.reduce<Record<string, number>>((acc, j) => {
      acc[j.status] = (acc[j.status] ?? 0) + 1;
      return acc;
    }, {});
    const summary = Object.entries(counts)
      .map(([s, n]) => `${colorStatus(s)} ${n}`)
      .join("  ");
    console.log(c.bold(`━ ${key}`) + c.dim(`  (${rows.length})  `) + summary);

    rows
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((j) => {
        const slug = j.name.includes("/") ? j.name.split("/").slice(1).join("/") : j.name;
        console.log(
          `    ${colorStatus(j.status.padEnd(10))}  ${slug.padEnd(32)}  ${c.dim(j.id)}`,
        );
      });
    console.log("");
  }
}

main().catch((err) => {
  console.error(`✗ status failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
