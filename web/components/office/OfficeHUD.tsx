"use client";

/**
 * OfficeHUD — top-strip frame for the pixel office.
 *
 * Left:  BATHYSPHERE-7 wordmark + Dean / station readout.
 * Right: Secondary controls collapse here so the canvas stays clean —
 *        MANIFEST toggle chip → SURFACE BRIEF · PDF link → crew badge.
 *
 * Design rule for this bar: nothing floats anymore. Everything a judge
 * might click except UPLOAD lives in this row, where it can't overlap
 * with the chat panel, search bar, or drop zone.
 */

import Link from "next/link";

interface Props {
  crewBadge?: React.ReactNode;
  studentId: string;
  /** Optional slot for the proposal drawer toggle chip — rendered by the
   *  drawer itself so open-state + pending count stay co-located. */
  manifestToggle?: React.ReactNode;
}

export default function OfficeHUD({
  crewBadge,
  studentId,
  manifestToggle,
}: Props) {
  return (
    <div
      className="relative z-30 flex items-center justify-between gap-4 px-6 py-4"
      style={{
        borderBottom: "1px solid rgba(230,165,89,0.22)",
        background:
          "linear-gradient(180deg, rgba(3,18,30,0.96) 0%, rgba(3,18,30,0.0) 100%)",
        boxShadow:
          "0 1px 0 rgba(230,165,89,0.05), 0 12px 32px -20px rgba(77,216,211,0.18)",
      }}
    >
      <div className="flex min-w-0 items-center gap-4">
        {/*
          SURFACE button.
          Intentionally a plain <a> (not next/link) so clicking it forces
          a full document navigation to /. That gives us two things the
          client-side router can't:
            1. The landing's ASCII submarine loader replays (module-level
               `hasBootedThisSession` flag resets on hard nav).
            2. We tear down /office completely — Lenis, PixelWorld rAF
               loops, HumanDelta SSE stream, Supabase realtime channel —
               so none of those leak into the landing's main thread.
          The UI still looks/feels identical; only the nav mechanism
          differs from the old next/link implementation the user flagged
          as broken.
        */}
        <a
          href="/"
          className="pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1 transition-colors"
          style={{
            background: "rgba(10,26,38,0.7)",
            boxShadow:
              "inset 0 0 0 1px rgba(77,216,211,0.45), inset 0 0 0 2px rgba(10,26,38,1)",
            color: "var(--sonar)",
            fontFamily: "var(--font-hud)",
            fontSize: 11,
            letterSpacing: "0.22em",
          }}
          title="Ascend to the surface — back to the landing page"
        >
          <span aria-hidden>←</span>
          <span>SURFACE</span>
        </a>

        <div className="min-w-0">
          <div
            className="pixel-text"
            style={{
              fontSize: 10,
              color: "var(--brass)",
              letterSpacing: "0.32em",
              textShadow: "0 0 6px rgba(230,165,89,0.3)",
            }}
          >
            BATHYSPHERE-7 · COUNSELING DECK
          </div>
          <div
            className="hud-text mt-1"
            style={{
              fontSize: 18,
              color: "var(--sonar)",
              letterSpacing: "0.1em",
            }}
          >
            DEAN &gt; STATION 01 &gt; LINE OPEN
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {manifestToggle}
        <Link
          href={`/api/profile/brief?studentId=${encodeURIComponent(studentId)}`}
          target="_blank"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 transition-colors"
          style={{
            background: "rgba(10,26,38,0.7)",
            boxShadow:
              "inset 0 0 0 1px rgba(230,165,89,0.45), inset 0 0 0 2px rgba(10,26,38,1)",
            color: "var(--brass)",
            fontFamily: "var(--font-hud)",
            fontSize: 11,
            letterSpacing: "0.22em",
          }}
          title="Pneumatic tube to the surface — student brief PDF"
        >
          <span aria-hidden>↑</span>
          <span>BRIEF · PDF</span>
        </Link>
        {crewBadge}
      </div>
    </div>
  );
}
