/**
 * Seed Maria — end-to-end fixture hydration for Bathysphere-7 demos.
 *
 * What it does:
 *   1. Reads web/.env.local manually (no dotenv dep).
 *   2. Connects to Supabase with SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
 *   3. Upserts the demo `students` row (Maria Isabel Delgado Santos).
 *   4. For every fixture in ../about/:
 *        - upsert a `source_files` row (natural key: student_id + filename)
 *        - paragraph-chunk the text → insert into `chunks`
 *        - run the matching Archivist worker
 *        - insert claims directly (bypasses `server-only` propose path)
 *        - auto-confirms every claim (demo convenience)
 *
 * Usage:
 *   npm run seed            # live run against Supabase
 *   npm run seed -- --dry   # print counts but hit no network
 *   npm run seed -- --reset # delete Maria's prior data first (safe — bounded)
 *
 * Design notes:
 *   - Deliberately NOT importing from lib/graph/claims.ts or lib/supabase/*;
 *     those pull `server-only` which node-runs-outside-Next chokes on.
 *   - Workers get imported via namespace-default interop (same tsx quirk as
 *     eval-archivist.mts).
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import * as Transcript from "../lib/agents/archivist/workers/transcript.ts";
import * as Essay from "../lib/agents/archivist/workers/essay.ts";
import * as Financial from "../lib/agents/archivist/workers/financial.ts";
import * as Activity from "../lib/agents/archivist/workers/activity.ts";
import type {
  ArchivistWorker,
  ProposedClaim,
} from "../lib/agents/archivist/types.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pick = <T,>(m: any, k: string): T => m[k] ?? m.default?.[k];
const WORKERS: Record<string, ArchivistWorker> = {
  transcript: pick(Transcript, "transcriptWorker"),
  essay: pick(Essay, "essayWorker"),
  financial: pick(Financial, "financialWorker"),
  activity: pick(Activity, "activityWorker"),
};

const STUDENT_ID = "00000000-0000-4000-8000-000000000001";

interface Fixture {
  kind: keyof typeof WORKERS;
  filename: string;
}

const MARIA_FIXTURES: Fixture[] = [
  { kind: "transcript", filename: "01_transcript.txt" },
  { kind: "essay", filename: "02_common_app_essay_draft_v3.txt" },
  { kind: "essay", filename: "03_uc_piq_draft.txt" },
  { kind: "activity", filename: "04_activities_list.txt" },
  { kind: "financial", filename: "05_financial_info.txt" },
  { kind: "transcript", filename: "06_voice_memo_transcript.txt" }, // treat as transcript
];

// ──────────────────────────────────────────────────────────────────────
// env loader — reads web/.env.local into process.env without dotenv dep.

function loadEnvLocal() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "web/.env.local"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
    return p;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────
// Chunking.
// Paragraphs split on blank line; long paragraphs fall back to sentence
// packing so no chunk exceeds ~800 chars. Byte offsets are approximated
// via charIndex (good enough for ASCII-heavy fixtures).

interface LocalChunk {
  text: string;
  offsetStart: number;
  offsetEnd: number;
}

function chunkText(text: string, maxLen = 800): LocalChunk[] {
  const out: LocalChunk[] = [];
  const paras = text.split(/\n\s*\n/);
  let cursor = 0;
  for (const para of paras) {
    const start = text.indexOf(para, cursor);
    cursor = start + para.length;
    const trimmed = para.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.length <= maxLen) {
      out.push({
        text: trimmed,
        offsetStart: start,
        offsetEnd: start + para.length,
      });
      continue;
    }
    // Long paragraph — break on sentence boundaries.
    let cur = "";
    let curStart = start;
    let pos = start;
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      if (cur.length + s.length + 1 > maxLen && cur.length > 0) {
        out.push({ text: cur.trim(), offsetStart: curStart, offsetEnd: pos });
        cur = "";
        curStart = pos;
      }
      cur += (cur ? " " : "") + s;
      pos += s.length + 1;
    }
    if (cur.trim().length > 0) {
      out.push({ text: cur.trim(), offsetStart: curStart, offsetEnd: pos });
    }
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────
// Main.

async function main() {
  const args = new Set(process.argv.slice(2));
  const dry = args.has("--dry");
  const reset = args.has("--reset");
  const envPath = loadEnvLocal();

  console.log(
    `🌊 Nami seed · Maria Isabel Delgado Santos\n` +
      `   env file: ${envPath ?? "(none — using process.env)"}\n` +
      `   dry run:  ${dry}\n` +
      `   reset:    ${reset}`,
  );

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dry && (!supaUrl || !serviceKey)) {
    console.error(
      `\n✗ Missing credentials for live seed.\n\n` +
        `  Need in web/.env.local:\n` +
        `    NEXT_PUBLIC_SUPABASE_URL   ${supaUrl ? "✓" : "✗"}\n` +
        `    SUPABASE_SERVICE_ROLE_KEY  ${serviceKey ? "✓" : "✗"}\n\n` +
        `  Get the service role key from the Supabase dashboard →\n` +
        `  Project Settings → API → service_role (secret).\n\n` +
        `  Or run \`npm run seed -- --dry\` to preview without a live DB.\n`,
    );
    process.exit(1);
  }

  // Import the Supabase client dynamically so --dry can skip it.
  const supabase = dry
    ? null
    : (await import("@supabase/supabase-js")).createClient(supaUrl!, serviceKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

  const aboutDir = path.resolve(process.cwd(), "..", "about");

  // Step 1 — ensure Maria exists.
  if (supabase) {
    if (reset) {
      console.log(`\n→ reset: deleting prior Maria data`);
      await supabase.from("source_files").delete().eq("student_id", STUDENT_ID);
      // claims/chunks cascade via FK
    }
    const { error } = await supabase.from("students").upsert(
      {
        id: STUDENT_ID,
        display_name: "Maria Isabel Delgado Santos",
      },
      { onConflict: "id" },
    );
    if (error) {
      console.error(`  ✗ students upsert: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ students row ensured`);
  }

  // Step 2 — ingest each fixture.
  let totalChunks = 0;
  let totalClaims = 0;

  for (const fx of MARIA_FIXTURES) {
    const p = path.join(aboutDir, fx.filename);
    let text: string;
    try {
      text = await fsp.readFile(p, "utf8");
    } catch (e) {
      console.warn(`  ⚠ missing fixture ${fx.filename} — skipping`);
      continue;
    }
    const chunks = chunkText(text);

    if (dry || !supabase) {
      console.log(
        `  [dry] ${fx.filename.padEnd(40)} · ${fx.kind.padEnd(10)} · ${chunks.length} chunks`,
      );
      const workerChunk = await WORKERS[fx.kind]({
        studentId: STUDENT_ID,
        sourceFileId: null,
        filename: fx.filename,
        text,
      });
      console.log(`       → ${workerChunk.claims.length} claims would propose`);
      totalChunks += chunks.length;
      totalClaims += workerChunk.claims.length;
      continue;
    }

    // source_files upsert (natural key: student + filename)
    const { data: existing } = await supabase
      .from("source_files")
      .select("id")
      .eq("student_id", STUDENT_ID)
      .eq("filename", fx.filename)
      .maybeSingle();

    let sourceFileId = existing?.id as string | undefined;

    if (!sourceFileId) {
      const { data: inserted, error: insErr } = await supabase
        .from("source_files")
        .insert({
          student_id: STUDENT_ID,
          kind: fx.kind,
          filename: fx.filename,
          storage_path: `seed/maria/${fx.filename}`,
          mime_type: "text/plain",
          size_bytes: text.length,
        })
        .select("id")
        .single();
      if (insErr || !inserted) {
        console.error(`  ✗ source_files insert ${fx.filename}: ${insErr?.message}`);
        continue;
      }
      sourceFileId = inserted.id as string;
    } else {
      // wipe stale chunks/claims for this source_file so re-runs are clean
      await supabase.from("chunks").delete().eq("source_file_id", sourceFileId);
      await supabase.from("claims").delete().eq("source_file_id", sourceFileId);
    }

    // chunks — insert in one shot
    const chunkRows = chunks.map((c) => ({
      source_file_id: sourceFileId!,
      source_kind: fx.kind,
      text: c.text,
      offset_start: c.offsetStart,
      offset_end: c.offsetEnd,
    }));
    const { data: insertedChunks, error: chunkErr } = await supabase
      .from("chunks")
      .insert(chunkRows)
      .select("id, text, offset_start");
    if (chunkErr) {
      console.error(`  ✗ chunks insert ${fx.filename}: ${chunkErr.message}`);
      continue;
    }
    const chunkIds = (insertedChunks ?? []).map((c) => c.id as string);

    // archivist worker
    const res = await WORKERS[fx.kind]({
      studentId: STUDENT_ID,
      sourceFileId: sourceFileId!,
      filename: fx.filename,
      text,
    });

    // Map claims → chunks by offset overlap (best-effort).
    const claimRows = res.claims.map((c: ProposedClaim) => {
      const chunkId = pickClaimChunk(c, chunks, chunkIds);
      return {
        student_id: STUDENT_ID,
        subject_entity: c.subjectEntity ?? "Student",
        predicate: c.predicate,
        object: c.object ?? null,
        confidence: c.confidence ?? 0.7,
        status: "confirmed", // auto-confirm for demo
        confirmed_at: new Date().toISOString(),
        sensitivity: c.sensitivity ?? "low",
        source_file_id: sourceFileId!,
        source_chunk_id: chunkId,
        extracted_by: c.extractedBy ?? `archivist.${res.workerName}`,
        reasoning: c.reasoning ?? null,
      };
    });

    if (claimRows.length > 0) {
      const { error: claimErr } = await supabase
        .from("claims")
        .upsert(claimRows, {
          onConflict: "source_file_id,predicate,subject_entity",
          ignoreDuplicates: true,
        });
      if (claimErr) {
        console.error(`  ✗ claims insert ${fx.filename}: ${claimErr.message}`);
      }
    }

    totalChunks += chunks.length;
    totalClaims += claimRows.length;
    console.log(
      `  ✓ ${fx.filename.padEnd(40)} · ${String(chunks.length).padStart(3)} chunks · ${String(
        claimRows.length,
      ).padStart(3)} claims`,
    );
  }

  console.log(`\n🌊 Done. ${totalChunks} chunks, ${totalClaims} claims.`);
  if (dry) console.log(`   (dry run — nothing was written)`);
}

function pickClaimChunk(
  claim: ProposedClaim,
  chunks: LocalChunk[],
  chunkIds: string[],
): string | null {
  // Workers don't yet emit byte offsets on claims. Default to first chunk.
  // Future: thread offset info through ProposedClaim + this becomes a lookup.
  if (chunks.length === 0) return null;
  if ((claim as unknown as { offsetStart?: number }).offsetStart !== undefined) {
    const off = (claim as unknown as { offsetStart: number }).offsetStart;
    const idx = chunks.findIndex(
      (c) => c.offsetStart <= off && c.offsetEnd >= off,
    );
    if (idx >= 0) return chunkIds[idx] ?? null;
  }
  return chunkIds[0] ?? null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
