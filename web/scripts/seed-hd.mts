/**
 * Seed Human Delta with a specialist's starter library.
 *
 * Usage (from web/):
 *   npx tsx scripts/seed-hd.ts match-maker
 *   npx tsx scripts/seed-hd.ts bursar
 *   npx tsx scripts/seed-hd.ts scout
 *   npx tsx scripts/seed-hd.ts all
 *   npx tsx scripts/seed-hd.ts scout --limit 2     # smoke-test with 2 URLs
 *   npx tsx scripts/seed-hd.ts bursar --wait       # block until jobs finish
 *   npx tsx scripts/seed-hd.ts scout --dry         # print plan, don't kick off
 *
 * What it does:
 *   1. Loads HUMANDELTA_API_KEY from web/.env.local.
 *   2. Fetches the existing index jobs from HD so we can skip URLs that have
 *      already been seeded (idempotent — safe to re-run).
 *   3. For each seed entry not yet indexed, POSTs to /v1/indexes (via the
 *      SDK's `indexes.create`).
 *   4. If `--wait`, polls each new job until it reaches a terminal state.
 *
 * We do NOT import web/lib/humandelta.ts — that file is marked
 * `server-only` and will reject outside of a Next.js runtime. Instead we
 * use the `humandelta` npm package directly from Node.
 */

import { config as loadEnv } from "dotenv";
import { HumanDelta } from "humandelta";
import { resolve } from "node:path";

import { MATCH_MAKER_SEEDS } from "./seed/match-maker.mjs";
import { BURSAR_SEEDS } from "./seed/bursar.mjs";
import { SCOUT_SEEDS } from "./seed/scout.mjs";
import type { SeedEntry, SeedSpecialist } from "./seed/types.mjs";

// ──────────────────────────────────────────────────────────────────────
// Env loading — check .env.local first, fall back to .env
// ──────────────────────────────────────────────────────────────────────

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const API_KEY = process.env.HUMANDELTA_API_KEY;
const BASE_URL = process.env.HUMANDELTA_BASE_URL ?? "https://api.humandelta.ai";

if (!API_KEY || !API_KEY.startsWith("hd_live_")) {
  console.error(
    "\x1b[31m✗ HUMANDELTA_API_KEY missing / malformed in web/.env.local\x1b[0m",
  );
  console.error("  Expected format: hd_live_…");
  process.exit(1);
}

const hd = new HumanDelta({ apiKey: API_KEY, baseUrl: BASE_URL });

// ──────────────────────────────────────────────────────────────────────
// CLI parsing
// ──────────────────────────────────────────────────────────────────────

const SEED_SETS: Record<SeedSpecialist, readonly SeedEntry[]> = {
  "match-maker": MATCH_MAKER_SEEDS,
  bursar: BURSAR_SEEDS,
  scout: SCOUT_SEEDS,
};

interface Args {
  specialists: SeedSpecialist[];
  limit: number | null;
  wait: boolean;
  dry: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error(
      "usage: tsx scripts/seed-hd.ts <match-maker|bursar|scout|all> [--limit N] [--wait] [--dry]",
    );
    process.exit(1);
  }
  const target = argv[0];
  const specialists: SeedSpecialist[] =
    target === "all"
      ? (Object.keys(SEED_SETS) as SeedSpecialist[])
      : (SEED_SETS[target as SeedSpecialist]
          ? [target as SeedSpecialist]
          : (() => {
              console.error(`unknown specialist: ${target}`);
              process.exit(1);
            })());

  const limitIdx = argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && argv[limitIdx + 1]
      ? parseInt(argv[limitIdx + 1] ?? "", 10)
      : null;

  return {
    specialists,
    limit: limit && !Number.isNaN(limit) ? limit : null,
    wait: argv.includes("--wait"),
    dry: argv.includes("--dry"),
  };
}

// ──────────────────────────────────────────────────────────────────────
// Colors (TTY-only; no-op in CI logs)
// ──────────────────────────────────────────────────────────────────────

const supportsColor = process.stdout.isTTY;
const c = {
  dim: (s: string) => (supportsColor ? `\x1b[2m${s}\x1b[0m` : s),
  green: (s: string) => (supportsColor ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s: string) => (supportsColor ? `\x1b[33m${s}\x1b[0m` : s),
  red: (s: string) => (supportsColor ? `\x1b[31m${s}\x1b[0m` : s),
  cyan: (s: string) => (supportsColor ? `\x1b[36m${s}\x1b[0m` : s),
  bold: (s: string) => (supportsColor ? `\x1b[1m${s}\x1b[0m` : s),
};

// ──────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  console.log(c.bold(`\n▸ Human Delta seed run`));
  console.log(c.dim(`  base: ${BASE_URL}`));
  console.log(c.dim(`  specialists: ${args.specialists.join(", ")}`));
  if (args.limit) console.log(c.dim(`  limit: ${args.limit}`));
  if (args.dry) console.log(c.yellow(`  dry-run (nothing will be indexed)\n`));
  else console.log("");

  // Pull existing jobs so we can dedupe by name. HD returns up to 100 per
  // list() call by default — fine for our volume.
  const existing = await hd.indexes.list({ limit: 200 });
  const existingNames = new Set(existing.map((j) => j.name));

  console.log(
    c.dim(
      `  existing index jobs: ${existing.length} (${existingNames.size} unique names)\n`,
    ),
  );

  const kickedOff: Array<{ name: string; id: string }> = [];
  let skipped = 0;
  let failed = 0;

  for (const specialist of args.specialists) {
    const seeds = SEED_SETS[specialist];
    const slice = args.limit ? seeds.slice(0, args.limit) : seeds;

    console.log(c.bold(`\n━ ${specialist} (${slice.length} URLs)`));

    for (const entry of slice) {
      if (existingNames.has(entry.name)) {
        console.log(c.dim(`  ⊘ skip   ${entry.name}  (already indexed)`));
        skipped++;
        continue;
      }
      if (args.dry) {
        console.log(
          `  → would seed ${c.cyan(entry.name)}  ${c.dim(`[${entry.maxPages}p]`)}  ${entry.url}`,
        );
        continue;
      }

      try {
        const job = await hd.indexes.create(entry.url, {
          maxPages: entry.maxPages,
          name: entry.name,
        });
        kickedOff.push({ name: entry.name, id: job.id });
        console.log(
          c.green(`  ✓ queued`) +
            `  ${entry.name.padEnd(34)}  ${c.dim(`[${entry.maxPages}p]`)}  ${c.dim(job.id)}`,
        );
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(
          c.red(`  ✗ fail   `) +
            `${entry.name.padEnd(34)}  ${c.dim(msg.slice(0, 80))}`,
        );
      }
    }
  }

  console.log(
    c.bold(
      `\n▸ queued ${kickedOff.length}, skipped ${skipped}, failed ${failed}\n`,
    ),
  );

  if (args.dry || kickedOff.length === 0) return;

  if (args.wait) {
    console.log(c.dim(`  waiting for ${kickedOff.length} jobs to finish…\n`));
    // Poll each job to terminal state. We serialize to keep the log readable;
    // HD is already crawling them in parallel server-side.
    for (const { name, id } of kickedOff) {
      const start = Date.now();
      try {
        const job = await hd.indexes.get(id);
        await job.wait(3000, 5 * 60_000);
        const secs = ((Date.now() - start) / 1000).toFixed(0);
        const tag =
          job.status === "done" || job.status === "completed"
            ? c.green(`✓ ${job.status}`)
            : c.yellow(`· ${job.status}`);
        console.log(`  ${tag}  ${name.padEnd(34)}  ${c.dim(`${secs}s`)}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(c.red(`  ✗ wait   `) + `${name.padEnd(34)}  ${c.dim(msg)}`);
      }
    }
    console.log("");
  } else {
    console.log(
      c.dim(
        `  check status with:  npx tsx scripts/hd-status.ts\n` +
          `  or add --wait to block until done.\n`,
      ),
    );
  }
}

main().catch((err) => {
  console.error(c.red(`\n✗ seed failed: ${err instanceof Error ? err.message : err}\n`));
  process.exit(1);
});
