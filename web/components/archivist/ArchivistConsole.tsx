"use client";

/**
 * ArchivistConsole — the three-panel interactive station.
 *
 *   ┌ INTAKE CHUTE ┐  ┌ MANIFEST ┐  ┌ SONAR ┐
 *   │ drop files   │  │ list     │  │ query │
 *   └──────────────┘  └──────────┘  └───────┘
 *
 * Everything talks through /api/archivist/*. API keys stay on the server.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────
   Shared shapes (loose — match the server's JSON shape)
   ────────────────────────────────────────────────────────────── */

type HdDoc = {
  doc_id: string;
  doc_name: string;
  category?: string | null;
  mime_type?: string | null;
  created_at?: string | null;
};

type HdResult = {
  chunk_id: string;
  score: number;
  text: string;
  source_url: string;
  source_type: "web" | "document";
  page_title?: string | null;
  doc_id?: string | null;
};

type UploadStatus =
  | { state: "queued" }
  | { state: "uploading" }
  | { state: "done"; doc?: HdDoc }
  | { state: "error"; message: string };

type Upload = {
  id: string;
  file: File;
  status: UploadStatus;
};

/* ──────────────────────────────────────────────────────────────
   Root
   ────────────────────────────────────────────────────────────── */

export default function ArchivistConsole() {
  const [docs, setDocs] = useState<HdDoc[] | null>(null);
  const [docsConfigured, setDocsConfigured] = useState<boolean>(true);

  const refreshDocs = useCallback(async () => {
    try {
      const r = await fetch("/api/archivist/documents", { cache: "no-store" });
      const j = await r.json();
      if (j.configured === false) {
        setDocsConfigured(false);
        setDocs([]);
        return;
      }
      setDocsConfigured(true);
      setDocs(Array.isArray(j.documents) ? j.documents : []);
    } catch {
      setDocs([]);
    }
  }, []);

  useEffect(() => {
    void refreshDocs();
  }, [refreshDocs]);

  return (
    <>
      <IntakeChute onUploaded={refreshDocs} configured={docsConfigured} />
      <Manifest docs={docs} configured={docsConfigured} onDeleted={refreshDocs} />
      <SonarRetrieval />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   1. Intake Chute — the drag-drop panel
   ────────────────────────────────────────────────────────────── */

function IntakeChute({
  onUploaded,
  configured,
}: {
  onUploaded: () => void | Promise<void>;
  configured: boolean;
}) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pushFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;

      const fresh: Upload[] = arr.map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file: f,
        status: { state: "queued" },
      }));
      setUploads((prev) => [...fresh, ...prev]);

      // Upload each one in parallel, but update state per file so progress
      // feels granular even though each POST is a single multipart roundtrip.
      for (const u of fresh) {
        void uploadOne(u);
      }
    },
    [],
  );

  async function uploadOne(u: Upload) {
    setUploads((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, status: { state: "uploading" } } : x)),
    );
    const fd = new FormData();
    fd.append("file", u.file, u.file.name);
    try {
      const r = await fetch("/api/archivist/upload", { method: "POST", body: fd });
      const j = (await r.json()) as {
        uploaded?: HdDoc[];
        errors?: { name: string; message: string }[];
        error?: string;
      };
      if (!r.ok) {
        setUploads((prev) =>
          prev.map((x) =>
            x.id === u.id
              ? {
                  ...x,
                  status: {
                    state: "error",
                    message: j.error ?? `HTTP ${r.status}`,
                  },
                }
              : x,
          ),
        );
        return;
      }
      const doc = j.uploaded?.[0];
      const err = j.errors?.[0];
      setUploads((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? {
                ...x,
                status: err
                  ? { state: "error", message: err.message }
                  : { state: "done", doc },
              }
            : x,
        ),
      );
      if (doc) await onUploaded();
    } catch (e) {
      setUploads((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? {
                ...x,
                status: {
                  state: "error",
                  message: e instanceof Error ? e.message : String(e),
                },
              }
            : x,
        ),
      );
    }
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) pushFiles(e.dataTransfer.files);
    },
    [pushFiles],
  );

  const onBrowse = () => inputRef.current?.click();
  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) pushFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <Panel title="INTAKE CHUTE" subtitle="PNEUMATIC · RECORDS-3A">
      <p
        className="mb-4"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--kelp)",
          lineHeight: 1.55,
        }}
      >
        Drop a transcript, test report, financial form, essay draft — anything.
        The Archivist parses it, extracts claims, and slots it into the
        shared context library. Every other specialist can then cite it.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={onBrowse}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onBrowse();
        }}
        className="relative cursor-pointer select-none overflow-hidden px-6 py-10 text-center transition-transform"
        style={{
          borderRadius: 6,
          background:
            "linear-gradient(180deg, rgba(10,26,38,0.9) 0%, rgba(3,18,30,0.95) 100%)",
          boxShadow: dragOver
            ? "inset 0 0 0 2px rgba(230,165,89,0.9), 0 0 70px rgba(230,165,89,0.55)"
            : undefined,
          animation: dragOver
            ? "chute-pulse-hot 1.2s ease-in-out infinite"
            : "chute-pulse 2.4s ease-in-out infinite",
        }}
      >
        {/* Brass rim — mimics the submarine tube intake */}
        <div
          className="pointer-events-none absolute inset-2"
          style={{
            borderRadius: 4,
            boxShadow:
              "inset 0 0 0 1px rgba(230,165,89,0.45), inset 0 0 0 2px rgba(10,26,38,1), inset 0 0 0 3px rgba(156,111,59,0.5)",
          }}
        />
        {/* Top brass placard */}
        <div
          className="pixel-text absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 px-3 py-1"
          style={{
            fontSize: 9,
            color: "var(--abyss-deep)",
            background: "linear-gradient(180deg,#e6a559 0%,#9c6f3b 100%)",
            letterSpacing: "0.28em",
            boxShadow: "0 0 0 1px var(--abyss-deep)",
          }}
        >
          DROP HATCH
        </div>

        <IconChute active={dragOver} />

        <div
          className="pixel-text mt-3"
          style={{ fontSize: 18, color: "var(--pearl)", letterSpacing: "0.1em" }}
        >
          {dragOver ? "RELEASE TO SEAL" : "DROP FILES HERE"}
        </div>
        <div
          className="hud-text mt-2"
          style={{ fontSize: 14, color: "var(--kelp)", letterSpacing: "0.18em" }}
        >
          pdf · docx · csv · mp3 · png · jpg · wav
        </div>
        <div
          className="hud-text mt-4 inline-block px-2 py-1"
          style={{
            fontSize: 12,
            color: "var(--sonar)",
            letterSpacing: "0.24em",
            boxShadow: "inset 0 0 0 1px rgba(124,255,147,0.3)",
          }}
        >
          — or click to browse —
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onPicked}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.tsv,.json,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.m4a,.aac,.flac,.ogg"
        />
      </div>

      {!configured && (
        <div
          className="hud-text mt-4 rounded-sm px-3 py-2"
          style={{
            fontSize: 13,
            color: "var(--coral)",
            background: "rgba(255,117,87,0.08)",
            boxShadow: "inset 0 0 0 1px rgba(255,117,87,0.35)",
            letterSpacing: "0.12em",
          }}
        >
          ! server reports HUMANDELTA_API_KEY missing · uploads will error
          until it's set in <code>web/.env.local</code>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="mt-6">
          <div
            className="pixel-text mb-2"
            style={{ fontSize: 9, color: "var(--brass)", letterSpacing: "0.24em" }}
          >
            TRANSIT LOG
          </div>
          <ul className="flex flex-col gap-1.5">
            {uploads.map((u) => (
              <UploadRow key={u.id} upload={u} />
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function IconChute({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      className="mx-auto block"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    >
      {/* Tube */}
      <rect x={22} y={6}  width={20} height={4}  fill="#9c6f3b" />
      <rect x={22} y={10} width={20} height={22} fill="#142a3d" />
      <rect x={22} y={10} width={20} height={2}  fill="#0a1a26" />
      <rect x={22} y={32} width={20} height={4}  fill="#9c6f3b" />
      {/* Chute opening — glow when active */}
      <rect x={24} y={12} width={16} height={18} fill={active ? "#e6a559" : "#0a2a2d"} opacity={active ? 0.6 : 1} />
      <rect x={26} y={14} width={12} height={1}  fill={active ? "#ffd78a" : "#7cff93"} opacity={active ? 1 : 0.5} />
      <rect x={26} y={17} width={12} height={1}  fill={active ? "#ffd78a" : "#7cff93"} opacity={active ? 0.8 : 0.3} />
      <rect x={26} y={20} width={12} height={1}  fill={active ? "#ffd78a" : "#7cff93"} opacity={active ? 0.6 : 0.2} />
      {/* Rivets */}
      <rect x={23} y={7}  width={1} height={1} fill="#0a1a26" />
      <rect x={40} y={7}  width={1} height={1} fill="#0a1a26" />
      <rect x={23} y={33} width={1} height={1} fill="#0a1a26" />
      <rect x={40} y={33} width={1} height={1} fill="#0a1a26" />
      {/* Conveyor below */}
      <rect x={14} y={38} width={36} height={4} fill="#2c3e4f" />
      <rect x={14} y={38} width={36} height={1} fill="#1a2836" />
      <rect x={14} y={42} width={36} height={1} fill="#0a1418" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={16 + i * 6}
          y={39}
          width={2}
          height={2}
          fill="#5a7388"
        />
      ))}
      {/* Supports */}
      <rect x={16} y={44} width={2} height={14} fill="#3e5a73" />
      <rect x={46} y={44} width={2} height={14} fill="#3e5a73" />
    </svg>
  );
}

function UploadRow({ upload }: { upload: Upload }) {
  const { file, status } = upload;
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  let tag = "QUEUED";
  let color = "var(--kelp)";
  let detail = "";
  switch (status.state) {
    case "queued":
      tag = "QUEUED";
      color = "var(--kelp)";
      break;
    case "uploading":
      tag = "TRANSMIT";
      color = "var(--bio)";
      break;
    case "done":
      tag = "INDEXED";
      color = "var(--sonar)";
      detail = status.doc?.doc_id ? `#${status.doc.doc_id.slice(0, 8)}` : "";
      break;
    case "error":
      tag = "ERROR";
      color = "var(--coral)";
      detail = status.message;
      break;
  }

  return (
    <li
      className="flex items-center gap-3 rounded-sm px-3 py-2"
      style={{
        background: "rgba(10,26,38,0.6)",
        boxShadow: "inset 0 0 0 1px rgba(77,216,211,0.12)",
      }}
    >
      <span
        className="pixel-text min-w-[74px] text-center"
        style={{
          fontSize: 9,
          color,
          letterSpacing: "0.2em",
          padding: "2px 6px",
          boxShadow: `inset 0 0 0 1px ${color}`,
        }}
      >
        {tag}
      </span>
      <span
        className="flex-1 truncate"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--pearl)",
        }}
      >
        {file.name}
      </span>
      <span
        className="hud-text whitespace-nowrap"
        style={{ fontSize: 13, color: "var(--kelp)", letterSpacing: "0.08em" }}
      >
        {sizeKb} kB
      </span>
      {detail && (
        <span
          className="hud-text max-w-[140px] truncate"
          title={detail}
          style={{ fontSize: 12, color, letterSpacing: "0.06em" }}
        >
          {detail}
        </span>
      )}
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────
   2. Manifest — indexed documents
   ────────────────────────────────────────────────────────────── */

function Manifest({
  docs,
  configured,
  onDeleted,
}: {
  docs: HdDoc[] | null;
  configured: boolean;
  onDeleted: () => void | Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Remove from the archive?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/archivist/documents/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await onDeleted();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Panel title="ARCHIVE MANIFEST" subtitle="LEDGER · RECORDS-3B">
      <div
        className="mb-4 flex items-baseline justify-between"
        style={{ color: "var(--kelp)" }}
      >
        <span
          className="hud-text"
          style={{ fontSize: 14, letterSpacing: "0.16em" }}
        >
          {docs == null
            ? "— pulling manifest…"
            : `${docs.length} record${docs.length === 1 ? "" : "s"} on file`}
        </span>
        <span
          className="pixel-text"
          style={{ fontSize: 8, color: "var(--brass-dim)", letterSpacing: "0.28em" }}
        >
          HUMAN DELTA /v1/documents
        </span>
      </div>

      {!configured ? (
        <EmptyState
          title="ARCHIVE LOCKED"
          detail="Server isn't configured with a Human Delta API key. Records are unreadable until HUMANDELTA_API_KEY is set."
          tone="coral"
        />
      ) : docs == null ? (
        <SkeletonList n={4} />
      ) : docs.length === 0 ? (
        <EmptyState
          title="MANIFEST EMPTY"
          detail="Drop your first record into the intake chute to the left. Every upload gets parsed, chunked, and embedded into the shared context library."
          tone="kelp"
        />
      ) : (
        <ul
          className="flex flex-col gap-1.5"
          style={{
            // Ledger-feeding tape effect — subtle diagonal stripe backdrop
            background:
              "repeating-linear-gradient(0deg, rgba(230,165,89,0.04) 0 6px, transparent 6px 12px)",
            backgroundAttachment: "local",
            animation: "tape-feed 10s linear infinite",
          }}
        >
          {docs.map((d) => (
            <ManifestRow
              key={d.doc_id}
              doc={d}
              deleting={deletingId === d.doc_id}
              onDelete={() => handleDelete(d.doc_id)}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ManifestRow({
  doc,
  deleting,
  onDelete,
}: {
  doc: HdDoc;
  deleting: boolean;
  onDelete: () => void;
}) {
  const kind = (doc.mime_type ?? "").split("/")[0] || "doc";
  return (
    <li
      className="flex items-center gap-3 rounded-sm px-3 py-2"
      style={{
        background: "rgba(10,26,38,0.65)",
        boxShadow: "inset 0 0 0 1px rgba(230,165,89,0.18)",
      }}
    >
      <span
        className="pixel-text flex min-w-[54px] flex-col items-center justify-center gap-0.5 rounded-sm"
        style={{
          background: "var(--hull)",
          padding: "3px 6px",
          color: "var(--brass)",
          fontSize: 8,
          letterSpacing: "0.18em",
          boxShadow: "inset 0 0 0 1px rgba(230,165,89,0.4)",
        }}
      >
        <span>{kind.slice(0, 5).toUpperCase()}</span>
        <span style={{ color: "var(--brass-dim)", fontSize: 7 }}>
          {doc.doc_id.slice(0, 6)}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            color: "var(--pearl)",
          }}
        >
          {doc.doc_name}
        </div>
        <div
          className="hud-text mt-0.5 truncate"
          style={{ fontSize: 12, color: "var(--kelp)", letterSpacing: "0.06em" }}
        >
          {doc.category ?? "uncategorised"}
          {doc.created_at && ` · ${formatDate(doc.created_at)}`}
        </div>
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="hud-text px-2 py-1 transition-colors"
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          color: deleting ? "var(--kelp)" : "var(--coral)",
          boxShadow: `inset 0 0 0 1px ${deleting ? "rgba(94,166,135,0.35)" : "rgba(255,117,87,0.35)"}`,
        }}
      >
        {deleting ? "…" : "PURGE"}
      </button>
    </li>
  );
}

function formatDate(s: string): string {
  try {
    const d = new Date(s);
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  } catch {
    return s;
  }
}

function SkeletonList({ n }: { n: number }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <li
          key={i}
          className="h-[46px] rounded-sm"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,26,38,0.5) 0%, rgba(20,42,61,0.8) 50%, rgba(10,26,38,0.5) 100%)",
            backgroundSize: "200% 100%",
            animation: "tape-feed 2.5s linear infinite",
            boxShadow: "inset 0 0 0 1px rgba(77,216,211,0.08)",
          }}
        />
      ))}
    </ul>
  );
}

function EmptyState({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: "kelp" | "coral";
}) {
  const color = tone === "coral" ? "var(--coral)" : "var(--kelp)";
  return (
    <div
      className="flex flex-col items-start gap-2 px-5 py-8"
      style={{
        boxShadow: `inset 0 0 0 1px ${tone === "coral" ? "rgba(255,117,87,0.25)" : "rgba(94,166,135,0.22)"}`,
        borderRadius: 4,
        background:
          "repeating-linear-gradient(45deg, rgba(3,18,30,0.3) 0 8px, rgba(10,26,38,0.3) 8px 16px)",
      }}
    >
      <span
        className="pixel-text"
        style={{ fontSize: 11, color, letterSpacing: "0.24em" }}
      >
        ◇ {title}
      </span>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--pearl)",
          lineHeight: 1.55,
        }}
      >
        {detail}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   3. Sonar Retrieval — semantic search
   ────────────────────────────────────────────────────────────── */

function SonarRetrieval() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HdResult[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/archivist/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, topK: 8 }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? `HTTP ${r.status}`);
        setResults([]);
      } else {
        setResults(Array.isArray(j.results) ? j.results : []);
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="SONAR RETRIEVAL" subtitle="SEMANTIC PING · RECORDS-3C">
      <form onSubmit={run} className="mb-4">
        <div
          className="flex items-center gap-2 rounded-sm px-3 py-2"
          style={{
            background: "rgba(3,18,30,0.9)",
            boxShadow:
              "0 0 0 1px rgba(77,216,211,0.3) inset, 0 0 18px rgba(77,216,211,0.08)",
          }}
        >
          <span
            className="hud-text"
            style={{ color: "var(--brass)", fontSize: 16 }}
          >
            PING &gt;
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="what GPA does UChicago expect…"
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-hud)",
              fontSize: 17,
              color: "var(--foam, var(--pearl))",
              letterSpacing: "0.04em",
            }}
          />
          <SonarEmitter spinning={loading} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span
            className="hud-text"
            style={{
              fontSize: 12,
              color: "var(--kelp)",
              letterSpacing: "0.2em",
            }}
          >
            ENTER · EMIT PING
          </span>
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="pixel-text px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontSize: 10,
              color: "var(--abyss-deep)",
              background:
                "linear-gradient(180deg,#e6a559 0%,#9c6f3b 100%)",
              letterSpacing: "0.24em",
              boxShadow: "inset 0 0 0 1px rgba(10,26,38,1)",
            }}
          >
            {loading ? "PINGING…" : "EMIT"}
          </button>
        </div>
      </form>

      {err && (
        <div
          className="hud-text mb-3 rounded-sm px-3 py-2"
          style={{
            fontSize: 13,
            color: "var(--coral)",
            background: "rgba(255,117,87,0.08)",
            boxShadow: "inset 0 0 0 1px rgba(255,117,87,0.35)",
            letterSpacing: "0.1em",
          }}
        >
          ! {err}
        </div>
      )}

      {results == null ? (
        <EmptyState
          title="NO PING EMITTED"
          detail="Ask the Archivist anything about the records you've uploaded — essay drafts, transcripts, college pages, FAFSA guides. Returns scored chunks with citations."
          tone="kelp"
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="NO RETURNS"
          detail="The sonar came back quiet. Either the library doesn't have anything matching this ping yet, or the query's too narrow — try re-phrasing."
          tone="kelp"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <ResultCard key={r.chunk_id} r={r} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function SonarEmitter({ spinning }: { spinning: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-block"
      style={{ width: 18, height: 18 }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(124,255,147,0.9) 0%, rgba(124,255,147,0) 70%)",
          animation: spinning
            ? "sonar-pulse 1.1s ease-out infinite"
            : undefined,
        }}
      />
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--sonar)",
          boxShadow: "0 0 8px var(--sonar)",
          opacity: spinning ? 1 : 0.7,
        }}
      />
    </span>
  );
}

function ResultCard({ r }: { r: HdResult }) {
  const pct = Math.max(4, Math.min(100, Math.round(r.score * 100)));
  return (
    <li
      className="rounded-sm px-3 py-2.5"
      style={{
        background: "rgba(10,26,38,0.6)",
        boxShadow: "inset 0 0 0 1px rgba(77,216,211,0.14)",
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="pixel-text"
          style={{
            fontSize: 9,
            color: "var(--sonar)",
            letterSpacing: "0.22em",
          }}
        >
          {r.source_type === "web" ? "WEB" : "DOC"}
        </span>
        <div
          className="flex-1"
          style={{ height: 3, background: "rgba(124,255,147,0.1)" }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, rgba(124,255,147,0.4) 0%, var(--sonar) 100%)",
            }}
          />
        </div>
        <span
          className="hud-text tabular-nums"
          style={{ fontSize: 12, color: "var(--kelp)", letterSpacing: "0.06em" }}
        >
          {pct}%
        </span>
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--pearl)",
          lineHeight: 1.5,
        }}
      >
        {r.text.length > 360 ? `${r.text.slice(0, 360)}…` : r.text}
      </p>
      {(r.page_title || r.source_url) && (
        <a
          href={r.source_url || "#"}
          target="_blank"
          rel="noreferrer noopener"
          className="hud-text mt-1.5 inline-block max-w-full truncate"
          style={{
            fontSize: 12,
            color: "var(--bio)",
            letterSpacing: "0.06em",
            textDecoration: "none",
            borderBottom: "1px dashed rgba(77,216,211,0.4)",
          }}
        >
          ↳ {r.page_title ?? r.source_url}
        </a>
      )}
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────
   Chrome — brass-trimmed panel
   ────────────────────────────────────────────────────────────── */

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative rounded-sm px-6 py-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(20,42,61,0.55) 0%, rgba(10,26,38,0.7) 100%)",
        boxShadow:
          "inset 0 0 0 1px rgba(77,216,211,0.14), inset 0 0 0 2px rgba(230,165,89,0.12), 0 20px 60px rgba(0,0,0,0.4)",
      }}
    >
      {/* Corner rivets */}
      {[
        ["left", "top"],
        ["right", "top"],
        ["left", "bottom"],
        ["right", "bottom"],
      ].map(([x, y], i) => (
        <span
          key={i}
          aria-hidden
          className="absolute"
          style={{
            [x]: 8,
            [y]: 8,
            width: 4,
            height: 4,
            background: "var(--brass)",
            boxShadow: "inset 0 0 0 1px var(--abyss-deep)",
          }}
        />
      ))}
      <header className="mb-5 flex items-baseline justify-between">
        <h2
          className="pixel-text"
          style={{ fontSize: 16, color: "var(--pearl)", letterSpacing: "0.18em" }}
        >
          {title}
        </h2>
        <span
          className="pixel-text"
          style={{ fontSize: 8, color: "var(--brass-dim)", letterSpacing: "0.28em" }}
        >
          {subtitle}
        </span>
      </header>
      {children}
    </section>
  );
}
