/**
 * POST /api/upload
 *
 * Full ingest pipeline in one request:
 *
 *   1. For each file:
 *        - upload bytes to Supabase Storage (source-files bucket)
 *        - insert a `source_files` row
 *        - emit `file_uploaded`
 *        - read text (for text-like MIME types) + chunk it
 *        - insert `chunks` rows
 *        - run the matching Archivist worker
 *        - propose claims (which emits `claim_proposed` per claim)
 *   2. Return per-file status so the DropZone can paint progress.
 *
 * We emit `ingestion_started` before the batch and `ingestion_finished`
 * after — lets the HUD pulse briefly and the graph auto-refresh.
 *
 * RLS: uses the admin client when `SUPABASE_SERVICE_ROLE_KEY` is set so
 * unauthed demo flows ingest straight through. Without the key this falls
 * back to the cookie client; RLS policies must permit the caller.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { emit } from "@/lib/events/bus";
import { DEMO_STUDENT_ID, hasSupabase } from "@/lib/utils/env";
import { getAdminSupabase } from "@/lib/supabase/service";
import { chunkText, extractTextFromFile } from "@/lib/ingest/chunk";
import { runArchivist, WORKERS } from "@/lib/agents/archivist";
import type { ArchivistWorkerResult } from "@/lib/agents/archivist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UploadedFile {
  id: string;
  filename: string;
  kind: string;
  sizeBytes: number;
  storagePath: string;
  chunkCount: number;
  claimsProposed: number;
  claimsCreated: number;
  workerName?: string;
  ingestSkipped?: "binary" | "no-worker";
}

export async function POST(req: Request) {
  if (!hasSupabase()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const studentId = (form.get("studentId") as string) || DEMO_STUDENT_ID;
  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files in upload" }, { status: 400 });
  }

  const supabase = await getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client unavailable" },
      { status: 503 },
    );
  }

  // Preflight: cheapest possible round-trip to verify the Supabase host is
  // actually reachable. If the project was paused / deleted the subdomain
  // goes NXDOMAIN — without this check we'd die per-file with generic
  // `TypeError: fetch failed` and leak partial work.
  const reachable = await supabase
    .from("source_files")
    .select("id", { count: "exact", head: true })
    .limit(1)
    .then(
      () => ({ ok: true as const }),
      (err: unknown) => ({ ok: false as const, err }),
    );
  if (!reachable.ok) {
    const raw = reachable.err instanceof Error
      ? reachable.err.message
      : String(reachable.err);
    const paused = /fetch failed|ENOTFOUND|NXDOMAIN|EAI_AGAIN|getaddrinfo/i.test(
      raw,
    );
    return NextResponse.json(
      {
        error: paused
          ? "Supabase project appears to be paused or deleted (host unreachable). Unpause it in the Supabase dashboard, or point NEXT_PUBLIC_SUPABASE_URL at a live project."
          : `Supabase preflight failed: ${raw}`,
      },
      { status: 502 },
    );
  }

  const sourceFileIds: string[] = [];
  const uploaded: UploadedFile[] = [];
  const started = Date.now();

  for (const file of files) {
    const id = randomUUID();
    const kind = inferKind(file);
    const storagePath = `${studentId}/${id}-${safeName(file.name)}`;

    const buf = new Uint8Array(await file.arrayBuffer());
    let uploadErr: { message: string } | null = null;
    try {
      const res = await supabase.storage
        .from("source-files")
        .upload(storagePath, buf, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      uploadErr = res.error;
    } catch (err) {
      // Most common case here: DNS failure / project paused. The supabase-js
      // client surfaces this as a raw `TypeError: fetch failed` bubble, which
      // is useless to show to the user. Translate it into something actionable.
      const msg = err instanceof Error ? err.message : String(err);
      const looksLikeNetwork =
        /fetch failed|NXDOMAIN|ENOTFOUND|EAI_AGAIN|getaddrinfo|socket hang up/i.test(
          msg,
        );
      return NextResponse.json(
        {
          error: looksLikeNetwork
            ? "Supabase is unreachable. Your project may be paused or deleted — check the Supabase dashboard and unpause it, or update NEXT_PUBLIC_SUPABASE_URL to a live project."
            : `Storage upload threw: ${msg}`,
        },
        { status: 502 },
      );
    }
    if (uploadErr) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadErr.message}` },
        { status: 500 },
      );
    }

    const { data: row, error: insertErr } = await supabase
      .from("source_files")
      .insert({
        id,
        student_id: studentId,
        kind,
        filename: file.name,
        storage_path: storagePath,
        mime_type: file.type || null,
        size_bytes: file.size,
      })
      .select("id, filename, kind, size_bytes, storage_path")
      .single();
    if (insertErr) {
      return NextResponse.json(
        { error: `DB insert failed: ${insertErr.message}` },
        { status: 500 },
      );
    }

    sourceFileIds.push(row.id);
    emit(
      {
        type: "file_uploaded",
        sourceFileId: row.id,
        filename: row.filename,
        kind: row.kind,
      },
      studentId,
    );

    // ── Chunk + archivist ───────────────────────────────────────────────
    // Re-reading the file bytes back out of the supabase upload path would
    // round-trip; we still have the original File object in-process so read
    // text directly from there.
    const text = await extractTextFromFile(file);
    let chunkCount = 0;
    let claimsProposed = 0;
    let claimsCreated = 0;
    let workerName: string | undefined;
    let ingestSkipped: UploadedFile["ingestSkipped"];

    if (text.trim().length === 0) {
      ingestSkipped = "binary";
    } else if (!WORKERS[kind]) {
      ingestSkipped = "no-worker";
    } else {
      const chunks = chunkText(text);
      if (chunks.length > 0) {
        const chunkRows = chunks.map((c) => ({
          source_file_id: row.id,
          source_kind: kind,
          text: c.text,
          offset_start: c.offsetStart,
          offset_end: c.offsetEnd,
        }));
        const { error: chunkErr } = await supabase
          .from("chunks")
          .insert(chunkRows);
        if (chunkErr) {
          console.warn(
            `[upload] chunks insert failed for ${file.name}:`,
            chunkErr.message,
          );
        } else {
          chunkCount = chunks.length;
        }
      }

      try {
        const res = await runArchivist({
          studentId,
          sourceFileId: row.id,
          kind,
          filename: file.name,
          text,
        });
        workerName = res.workerName;
        claimsProposed = res.claimsProposed;
        claimsCreated = res.claimsCreated;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[upload] archivist failed for ${file.name}:`, message);
      }
    }

    uploaded.push({
      id: row.id,
      filename: row.filename,
      kind: row.kind,
      sizeBytes: row.size_bytes ?? 0,
      storagePath: row.storage_path,
      chunkCount,
      claimsProposed,
      claimsCreated,
      workerName,
      ingestSkipped,
    });
  }

  emit(
    { type: "ingestion_started", sourceFileIds },
    studentId,
  );
  const totalClaims = uploaded.reduce((n, u) => n + u.claimsCreated, 0);
  emit(
    {
      type: "ingestion_finished",
      claimsProposed: totalClaims,
      durationMs: Date.now() - started,
    },
    studentId,
  );

  return NextResponse.json({ uploaded, durationMs: Date.now() - started });
}

function inferKind(file: File): string {
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  if (name.includes("transcript")) return "transcript";
  if (
    name.includes("essay") ||
    name.includes("piq") ||
    name.includes("common-app")
  )
    return "essay";
  if (name.includes("activit")) return "activity";
  if (
    name.includes("financial") ||
    name.includes("fafsa") ||
    name.includes("aid")
  )
    return "financial";
  if (mime.startsWith("audio/")) return "voice";
  if (mime.startsWith("image/")) return "photo";
  if (mime === "application/pdf") return "transcript"; // conservative default
  if (mime.startsWith("text/")) return "essay";
  return "other";
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

// Silence an unused-type warning in strict mode without bloating the bundle.
export type { ArchivistWorkerResult };
