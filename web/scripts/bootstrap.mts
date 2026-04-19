/**
 * One-shot bootstrap for Nami's Supabase project.
 *
 * Responsibilities:
 *   1. Load web/.env.local (SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL).
 *   2. Probe for the Nami schema (presence of `public.students`).
 *      - If missing, print a precise remediation (DATABASE_URL for db:push,
 *        or paste supabase/migrations/bundle.sql into the SQL Editor).
 *      - Exits with code 2 so CI / the user can tell it's a prereq failure.
 *   3. Verify the demo student row + storage bucket exist (warn-only).
 *   4. Invoke the Maria fixture seeder via a spawned `npm run seed` so its
 *      internal dotenv loader handles its own env parsing.
 *   5. Print a short "what now" checklist pointing at /office.
 *
 * Design notes:
 *   - Zero hard dependencies beyond what the seed script already uses.
 *   - Avoids importing anything `server-only` (we run outside the Next runtime).
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");
const BUNDLE_PATH = path.resolve(ROOT, "..", "supabase", "migrations", "bundle.sql");

function loadEnvLocal(): void {
  if (!fs.existsSync(ENV_LOCAL)) return;
  const raw = fs.readFileSync(ENV_LOCAL, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) process.env[key] = val;
  }
}

type ProbeResult =
  | { ok: true; tables: string[] }
  | { ok: false; reason: string; status?: number };

async function probeSchema(url: string, key: string): Promise<ProbeResult> {
  try {
    const res = await fetch(`${url}/rest/v1/students?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (res.status === 200) return { ok: true, tables: ["students"] };
    if (res.status === 404) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        reason: body.includes("Could not find the table")
          ? "Nami tables not yet created."
          : `Unexpected 404 from PostgREST: ${body.slice(0, 200)}`,
        status: 404,
      };
    }
    const body = await res.text().catch(() => "");
    return { ok: false, reason: `HTTP ${res.status}: ${body.slice(0, 200)}`, status: res.status };
  } catch (err) {
    return { ok: false, reason: `Network error: ${(err as Error).message}` };
  }
}

async function checkDemoStudent(url: string, key: string): Promise<boolean> {
  const res = await fetch(
    `${url}/rest/v1/students?select=id&id=eq.00000000-0000-4000-8000-000000000001`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) return false;
  const rows = (await res.json().catch(() => [])) as { id: string }[];
  return rows.length > 0;
}

async function checkBucket(url: string, key: string): Promise<boolean> {
  const res = await fetch(`${url}/storage/v1/bucket/source-files`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return res.ok;
}

function runSeed(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn("npm", ["run", "seed"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

function banner(title: string): void {
  const bar = "━".repeat(Math.max(8, Math.min(58, title.length + 4)));
  console.log(`\n${bar}\n  ${title}\n${bar}`);
}

async function main(): Promise<void> {
  loadEnvLocal();

  banner("Nami bootstrap");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "✗ Missing env vars. Required:\n" +
        `    NEXT_PUBLIC_SUPABASE_URL   ${url ? "✓" : "✗ missing"}\n` +
        `    SUPABASE_SERVICE_ROLE_KEY  ${serviceKey ? "✓" : "✗ missing"}\n\n` +
        `  Fill them in at ${ENV_LOCAL}`,
    );
    process.exit(1);
  }
  console.log(`✓ env.local loaded (${url})`);

  const probe = await probeSchema(url, serviceKey);
  if (!probe.ok) {
    console.error(`\n✗ Schema probe failed: ${probe.reason}`);
    console.error(
      `\n  To create the Nami schema you have two options:\n\n` +
        `  A)  Paste DATABASE_URL into web/.env.local and run:\n` +
        `        npm run db:push\n\n` +
        `  B)  Open Supabase Dashboard → SQL Editor → paste:\n` +
        `        ${BUNDLE_PATH}\n` +
        `      It's idempotent, safe to re-run.\n\n` +
        `  After either, re-run:  npm run bootstrap\n`,
    );
    process.exit(2);
  }
  console.log(`✓ Nami schema present (found public.students)`);

  const [hasStudent, hasBucket] = await Promise.all([
    checkDemoStudent(url, serviceKey),
    checkBucket(url, serviceKey),
  ]);
  console.log(
    hasStudent
      ? `✓ Demo student row (Maria) present`
      : `· Demo student row missing — will be upserted by the seed`,
  );
  console.log(
    hasBucket
      ? `✓ Storage bucket 'source-files' present`
      : `⚠ Storage bucket 'source-files' missing — uploads will 404 until you apply bundle.sql (it INSERTs the bucket)`,
  );

  banner("Seeding Maria's fixtures");
  const seedCode = await runSeed();
  if (seedCode !== 0) {
    console.error(`\n✗ Seed exited with code ${seedCode}. See output above.`);
    process.exit(seedCode);
  }

  banner("Bootstrap complete");
  console.log(
    "Next steps:\n" +
      "  1. npm run dev               # starts http://localhost:2847\n" +
      "  2. open http://localhost:2847/office?demo=maria\n" +
      "  3. Ask Dean: 'what's her story?'  → citations should hover-preview.\n" +
      "  4. Drop a .txt onto /office     → DropZone triggers the ingest pipeline.\n",
  );
}

main().catch((err) => {
  console.error("✗ Bootstrap crashed:", err);
  process.exit(1);
});
