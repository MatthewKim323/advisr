"use client";

/**
 * DropZone — full-viewport drag-and-drop overlay for /office.
 *
 *   - Idle: nothing visible. The whole page is drag-targetable via document-
 *     level listeners so students can drop files anywhere.
 *   - Drag-over: caustic-lit brass rim fades in with a "RELEASE TO SEAL"
 *     intercom placard. Matches the Archivist IntakeChute aesthetic.
 *   - Uploading: pinned TRANSIT LOG in the bottom-right, per-file progress
 *     rows (QUEUED → TRANSMIT → INDEXED / ERROR).
 *
 * After a successful batch the component fires a custom DOM event
 * `nami:uploads-indexed` which other /office clients (graph, local index)
 * listen for in addition to the SSE `ingestion_finished`. We do both so the
 * UI flip happens the instant the POST resolves, not when the SSE lands.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type UploadState =
  | { phase: "queued" }
  | { phase: "uploading" }
  | { phase: "done"; claims: number; chunks: number }
  | { phase: "error"; message: string };

interface TransitEntry {
  id: string;
  file: File;
  state: UploadState;
}

interface UploadResponse {
  uploaded: Array<{
    id: string;
    filename: string;
    kind: string;
    sizeBytes: number;
    chunkCount: number;
    claimsCreated: number;
    claimsProposed: number;
    ingestSkipped?: "binary" | "no-worker";
  }>;
  durationMs: number;
}

export default function DropZone({ studentId }: { studentId: string }) {
  const [dragOver, setDragOver] = useState(false);
  const [entries, setEntries] = useState<TransitEntry[]>([]);
  const dragDepth = useRef(0);

  /* ── Document-level drag hooks. Each `dragenter` increments a depth
     counter; `dragleave` decrements. This avoids flicker from children
     emitting their own leave events. */
  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current += 1;
      setDragOver(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragOver(false);
      pushFiles(Array.from(e.dataTransfer.files));
    };

    document.addEventListener("dragenter", onEnter);
    document.addEventListener("dragover", onOver);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onEnter);
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("drop", onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const fresh: TransitEntry[] = files.map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        file: f,
        state: { phase: "queued" },
      }));
      setEntries((prev) => [...fresh, ...prev]);
      void uploadBatch(fresh, studentId, setEntries);
    },
    [studentId],
  );

  // Hidden file input wired up for the manual intercom button below.
  const fileInput = useRef<HTMLInputElement | null>(null);
  const openPicker = () => fileInput.current?.click();

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) pushFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {/* Floating intercom-style upload button, bottom-left. Always visible
         so the student can browse even without dragging. */}
      <button
        type="button"
        onClick={openPicker}
        className="pointer-events-auto pixel-text absolute left-5 bottom-5 z-30 px-3 py-2 transition-transform"
        style={{
          fontSize: 10,
          letterSpacing: "0.24em",
          color: "var(--abyss-deep)",
          background: "linear-gradient(180deg,#e6a559 0%,#9c6f3b 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(10,26,38,1), 0 8px 22px rgba(230,165,89,0.35)",
        }}
      >
        ↓ DROP HATCH · UPLOAD
      </button>

      {dragOver && <Overlay />}
      {entries.length > 0 && <TransitLog entries={entries} />}
    </>
  );
}

function hasFiles(e: DragEvent): boolean {
  if (!e.dataTransfer) return false;
  const types = e.dataTransfer.types;
  if (!types) return false;
  for (let i = 0; i < types.length; i++) {
    if (types[i] === "Files") return true;
  }
  return false;
}

async function uploadBatch(
  fresh: TransitEntry[],
  studentId: string,
  setEntries: React.Dispatch<React.SetStateAction<TransitEntry[]>>,
) {
  const setPhase = (id: string, state: UploadState) =>
    setEntries((prev) =>
      prev.map((x) => (x.id === id ? { ...x, state } : x)),
    );
  for (const e of fresh) setPhase(e.id, { phase: "uploading" });

  const fd = new FormData();
  fd.append("studentId", studentId);
  for (const e of fresh) fd.append("files", e.file, e.file.name);

  try {
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = (await r.json().catch(() => ({}))) as Partial<UploadResponse> & {
      error?: string;
    };
    if (!r.ok) {
      const message = j.error ?? `HTTP ${r.status}`;
      for (const e of fresh) setPhase(e.id, { phase: "error", message });
      return;
    }
    // Map response back by filename; ordering isn't guaranteed but names are.
    const byName = new Map<string, UploadResponse["uploaded"][number]>();
    for (const u of j.uploaded ?? []) byName.set(u.filename, u);
    for (const e of fresh) {
      const u = byName.get(e.file.name);
      if (u) {
        setPhase(e.id, {
          phase: "done",
          claims: u.claimsCreated,
          chunks: u.chunkCount,
        });
      } else {
        setPhase(e.id, {
          phase: "error",
          message: "server didn't ack this file",
        });
      }
    }

    // Custom event so sibling components (constellation, local index,
    // HUD stats) can react immediately instead of waiting on SSE.
    window.dispatchEvent(
      new CustomEvent("nami:uploads-indexed", {
        detail: { durationMs: j.durationMs, uploaded: j.uploaded },
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    for (const e of fresh) setPhase(e.id, { phase: "error", message });
  }
}

/* ──────────────────────────────────────────────────────────────
   Full-viewport intake overlay
   ────────────────────────────────────────────────────────────── */

function Overlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(230,165,89,0.16) 0%, rgba(3,18,30,0.82) 70%)",
        animation: "dropzone-fade-in 220ms ease-out both",
      }}
    >
      <div
        className="relative px-10 py-8 text-center"
        style={{
          minWidth: 420,
          background:
            "linear-gradient(180deg, rgba(20,42,61,0.92) 0%, rgba(10,26,38,0.96) 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(230,165,89,0.7), inset 0 0 0 3px rgba(10,26,38,1), inset 0 0 0 4px rgba(156,111,59,0.55), 0 0 70px rgba(230,165,89,0.35)",
          animation: "dropzone-pulse 1.4s ease-in-out infinite",
        }}
      >
        <div
          className="pixel-text absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 px-3 py-1"
          style={{
            fontSize: 9,
            color: "var(--abyss-deep)",
            background: "linear-gradient(180deg,#e6a559 0%,#9c6f3b 100%)",
            letterSpacing: "0.32em",
            boxShadow: "0 0 0 1px var(--abyss-deep)",
          }}
        >
          DROP HATCH · PNEUMATIC
        </div>
        <div
          className="pixel-text"
          style={{
            fontSize: 26,
            color: "var(--pearl, #f1e4c5)",
            letterSpacing: "0.16em",
            textShadow: "0 0 18px rgba(124,255,147,0.3)",
          }}
        >
          RELEASE TO SEAL
        </div>
        <div
          className="hud-text mt-3"
          style={{
            fontSize: 13,
            color: "var(--kelp, #5ea687)",
            letterSpacing: "0.28em",
          }}
        >
          archivist ready · claims proposed live
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Transit log — pinned bottom-right
   ────────────────────────────────────────────────────────────── */

function TransitLog({ entries }: { entries: TransitEntry[] }) {
  return (
    <div
      className="pointer-events-auto absolute bottom-5 right-5 z-40 w-[340px]"
      style={{
        background: "rgba(10,26,38,0.92)",
        boxShadow:
          "inset 0 0 0 1px rgba(230,165,89,0.35), 0 12px 36px rgba(0,0,0,0.55)",
        borderRadius: 2,
      }}
    >
      <header
        className="pixel-text flex items-center justify-between px-3 py-2"
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          color: "var(--brass, #e6a559)",
          background:
            "linear-gradient(90deg, rgba(230,165,89,0.22) 0%, rgba(230,165,89,0.08) 100%)",
        }}
      >
        <span>TRANSIT LOG</span>
        <span style={{ color: "var(--brass-dim, #9c6f3b)", fontSize: 8 }}>
          /api/upload
        </span>
      </header>
      <ul className="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto px-3 py-2">
        {entries.map((e) => (
          <TransitRow key={e.id} entry={e} />
        ))}
      </ul>
    </div>
  );
}

function TransitRow({ entry }: { entry: TransitEntry }) {
  const { file, state } = entry;
  let tag = "QUEUED";
  let color = "var(--kelp, #5ea687)";
  let detail = `${Math.max(1, Math.round(file.size / 1024))} kB`;
  switch (state.phase) {
    case "queued":
      tag = "QUEUED";
      break;
    case "uploading":
      tag = "TRANSMIT";
      color = "var(--bio, #4dd8d3)";
      break;
    case "done":
      tag = "INDEXED";
      color = "var(--sonar, #7cff93)";
      detail =
        state.claims > 0
          ? `${state.chunks} chunks · ${state.claims} claims`
          : `${state.chunks} chunks`;
      break;
    case "error":
      tag = "ERROR";
      color = "var(--coral, #ff7557)";
      detail = state.message;
      break;
  }
  return (
    <li
      className="flex items-center gap-2 rounded-sm px-2 py-1.5"
      style={{
        background: "rgba(20,42,61,0.6)",
        boxShadow: "inset 0 0 0 1px rgba(77,216,211,0.14)",
      }}
    >
      <span
        className="pixel-text min-w-[72px] text-center"
        style={{
          fontSize: 9,
          color,
          letterSpacing: "0.2em",
          padding: "2px 5px",
          boxShadow: `inset 0 0 0 1px ${color}`,
        }}
      >
        {tag}
      </span>
      <span
        className="flex-1 truncate"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--pearl, #f1e4c5)",
        }}
      >
        {file.name}
      </span>
      <span
        className="hud-text whitespace-nowrap text-right"
        title={detail}
        style={{
          fontSize: 11,
          color,
          letterSpacing: "0.04em",
          maxWidth: 150,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {detail}
      </span>
    </li>
  );
}
