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

import { MATCH_MAKER_SEEDS } from "../lib/humandelta/seeds/match-maker.mjs";
import { BURSAR_SEEDS } from "../lib/humandelta/seeds/bursar.mjs";
import { SCOUT_SEEDS } from "../lib/humandelta/seeds/scout.mjs";
import type { SeedEntry, SeedSpecialist } from "../lib/humandelta/seeds/types.mjs";

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
  // list() call by default — fine for our volume. Skipped in --dry since
  // we don't need network access just to print the plan.
  let existingNames = new Set<string>();
  if (!args.dry) {
    try {
      const existing = await hd.indexes.list({ limit: 200 });
      // Filter out unnamed jobs (from crawls that didn't set a name) so
      // they don't poison the dedupe set as `undefined`/`null`.
      existingNames = new Set(
        existing.map((j) => j.name).filter((n): n is string => typeof n === "string"),
      );
      console.log(
        c.dim(
          `  existing index jobs: ${existing.length} (${existingNames.size} unique names)\n`,
        ),
      );
    } catch (err) {
      console.log(
        c.yellow(
          `  ⚠ couldn't list existing jobs (${err instanceof Error ? err.message.slice(0, 60) : "unknown"}) — seeding without dedupe\n`,
        ),
      );
    }
  }

  // Flatten all seeds into a single work queue so batching works across
  // specialists (HD's concurrency limit is per-key, not per-specialist).
  const queue: Array<SeedEntry & { specialist: SeedSpecialist }> = [];
  for (const specialist of args.specialists) {
    const seeds = SEED_SETS[specialist];
    const slice = args.limit ? seeds.slice(0, args.limit) : seeds;
    console.log(c.bold(`\n━ ${specialist} (${slice.length} URLs)`));
    for (const e of slice) {
      if (existingNames.has(e.name)) {
        console.log(c.dim(`  ⊘ skip   ${e.name}  (already indexed)`));
        continue;
      }
      if (args.dry) {
        console.log(
          `  → would seed ${c.cyan(e.name)}  ${c.dim(`[${e.maxPages}p]`)}  ${e.url}`,
        );
        continue;
      }
      queue.push({ ...e, specialist });
    }
  }

  if (args.dry || queue.length === 0) {
    console.log(c.bold(`\n▸ nothing to seed (dry-run or all skipped)\n`));
    return;
  }

  // HD's public API caps concurrent index jobs at 5 per key. We honor that
  // by walking the queue in batches of BATCH_SIZE, waiting for each batch
  // to reach a terminal state before queueing the next. This also gives
  // the live log a clean "batch 1/12 …" rhythm so the operator knows
  // roughly how long the seed run will take.
  const BATCH_SIZE = 5;
  const batches: Array<typeof queue> = [];
  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    batches.push(queue.slice(i, i + BATCH_SIZE));
  }

  let kicked = 0;
  let failed = 0;
  console.log(c.bold(`\n▸ seeding ${queue.length} URLs in ${batches.length} batch${batches.length === 1 ? "" : "es"} of ≤${BATCH_SIZE}\n`));

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi]!;
    console.log(c.bold(`── batch ${bi + 1}/${batches.length}`));

    // Kick off all N in parallel
    const ids: Array<{ name: string; id: string }> = [];
    for (const e of batch) {
      try {
        const job = await hd.indexes.create(e.url, {
          maxPages: e.maxPages,
          name: e.name,
        });
        ids.push({ name: e.name, id: job.id });
        kicked++;
        console.log(
          c.green(`  ✓ queued`) +
            `  ${e.name.padEnd(34)}  ${c.dim(`[${e.maxPages}p]`)}  ${c.dim(job.id)}`,
        );
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(
          c.red(`  ✗ fail   `) +
            `${e.name.padEnd(34)}  ${c.dim(msg.slice(0, 100))}`,
        );
      }
    }

    // Wait for all of THIS batch to reach terminal state before queueing
    // the next one. Even without --wait we need to drain so HD will accept
    // the next batch. The only thing --wait changes is verbosity.
    if (ids.length === 0) continue;
    if (args.wait) console.log(c.dim(`  waiting for ${ids.length} jobs…`));
    for (const { name, id } of ids) {
      const start = Date.now();
      try {
        const job = await hd.indexes.get(id);
        await job.wait(2000, 3 * 60_000);
        const secs = ((Date.now() - start) / 1000).toFixed(0);
        if (args.wait) {
          const tag =
            job.status === "done" || job.status === "completed"
              ? c.green(`  ✓ ${job.status}`)
              : c.yellow(`  · ${job.status}`);
          console.log(`  ${tag}  ${name.padEnd(34)}  ${c.dim(`${secs}s`)}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (args.wait) {
          console.log(c.red(`  ✗ wait   `) + `${name.padEnd(34)}  ${c.dim(msg.slice(0, 80))}`);
        }
      }
    }
  }

  console.log(
    c.bold(`\n▸ queued ${kicked}, failed ${failed}\n`),
  );
}

main().catch((err) => {
  console.error(c.red(`\n✗ seed failed: ${err instanceof Error ? err.message : err}\n`));
  process.exit(1);
});
