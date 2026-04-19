import ArchivistConsole from "@/components/archivist/ArchivistConsole";
import Link from "next/link";

/**
 * /archivist — the Archivist's office aboard Bathysphere-VII.
 *
 * Three modules stacked horizontally (responsive → vertical on mobile):
 *   1. PNEUMATIC INTAKE  — drag-drop files into the chute → /api/archivist/upload
 *   2. ARCHIVE MANIFEST   — everything currently indexed by Human Delta
 *   3. SONAR RETRIEVAL    — test semantic search over the ingested library
 *
 * All three talk to Human Delta via /api/archivist/* server routes. The key
 * is held server-side (HUMANDELTA_API_KEY). Failure modes are handled in
 * the client component.
 */
export default function ArchivistPage() {
  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1100px 700px at 30% -10%, rgba(10,42,68,0.65), transparent 60%)," +
          "radial-gradient(900px 700px at 110% 120%, rgba(10,26,38,0.8), transparent 60%)," +
          "var(--abyss-deep)",
      }}
    >
      {/* Slim top rail — keeps the submarine framing while saving vertical room. */}
      <header
        className="flex items-center justify-between border-b px-6 py-3"
        style={{
          borderColor: "rgba(77,216,211,0.14)",
          background: "rgba(3,18,30,0.6)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div className="flex items-center gap-5">
          <Link
            href="/office"
            className="hud-text inline-flex items-center gap-2 rounded-sm px-2 py-1 transition-colors hover:bg-[rgba(124,255,147,0.06)]"
            style={{
              color: "var(--sonar)",
              fontSize: 14,
              letterSpacing: "0.2em",
              boxShadow: "inset 0 0 0 1px rgba(124,255,147,0.25)",
            }}
          >
            <span aria-hidden>←</span> RETURN TO DECK
          </Link>
          <div>
            <div
              className="pixel-text"
              style={{ fontSize: 9, color: "var(--brass)", letterSpacing: "0.26em" }}
            >
              COMPARTMENT 03 · RECORDS
            </div>
            <h1
              className="pixel-text mt-1"
              style={{ fontSize: 28, color: "var(--pearl)", letterSpacing: "0.06em" }}
            >
              THE ARCHIVIST
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Gauge label="DEPTH" value="0614 m" />
          <Gauge label="INDEX" value="HUMAN DELTA" accent="var(--bio)" />
        </div>
      </header>

      <section className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 xl:grid-cols-[1.05fr_0.95fr_1fr]">
        <ArchivistConsole />
      </section>

      {/* Flavour stamp — hull rivets + classification notice */}
      <footer
        className="mx-auto mt-2 mb-10 flex max-w-[1600px] items-center justify-between px-6"
        style={{ color: "var(--kelp)" }}
      >
        <span
          className="hud-text"
          style={{ fontSize: 13, letterSpacing: "0.2em" }}
        >
          — records pressurised · context library synced with /memory/
        </span>
        <span
          className="pixel-text"
          style={{
            fontSize: 8,
            letterSpacing: "0.28em",
            color: "var(--brass-dim)",
          }}
        >
          CLASS · CONFIDENTIAL // STUDENT RECORDS
        </span>
      </footer>
    </main>
  );
}

function Gauge({
  label,
  value,
  accent = "var(--sonar)",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-end">
      <span
        className="pixel-text"
        style={{ fontSize: 8, color: "var(--brass-dim)", letterSpacing: "0.28em" }}
      >
        {label}
      </span>
      <span
        className="hud-text"
        style={{ fontSize: 16, color: accent, letterSpacing: "0.18em" }}
      >
        {value}
      </span>
    </div>
  );
}
