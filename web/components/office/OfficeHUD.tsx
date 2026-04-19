"use client";

/**
 * OfficeHUD — frame around the pixel-world canvas.
 *
 * Top band:    BATHYSPHERE-7 wordmark + crew badge.
 * Overlay:     Dean's "close line" — the one-sentence synthesis that fires
 *              on hero-beat transitions (pattern: "you wrote X, you said Y").
 * Bottom-right: Pneumatic tube to the Archivist's filing deck — downloads the
 *              student brief PDF.
 *
 * Visual language stays bathysphere: brass trim, sonar green, coral alerts.
 * We swap the *name* to "OfficeHUD" so clients thinking in counseling-office
 * terms still grep it, but the aesthetic is sub-all-the-way.
 */

import Link from "next/link";
import { useOfficeStore } from "@/lib/stores/officeStore";

interface Props {
  crewBadge?: React.ReactNode;
  studentId: string;
}

export default function OfficeHUD({ crewBadge, studentId }: Props) {
  const closeLine = useOfficeStore((s) => s.heroCloseLine);

  return (
    <>
      <div
        className="relative z-10 flex items-baseline justify-between px-6 py-4"
        style={{
          borderBottom: "1px solid rgba(230,165,89,0.22)",
          background:
            "linear-gradient(180deg, rgba(3,18,30,0.96) 0%, rgba(3,18,30,0.0) 100%)",
          boxShadow: "0 1px 0 rgba(230,165,89,0.05), 0 12px 32px -20px rgba(77,216,211,0.18)",
        }}
      >
        <div>
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
        {crewBadge}
      </div>

      {closeLine && (
        <div
          className="pointer-events-none absolute left-1/2 z-20 w-full max-w-[640px] -translate-x-1/2 px-6 text-center"
          style={{ top: 110 }}
        >
          <div
            className="pixel-text mb-1"
            style={{
              fontSize: 9,
              color: "var(--brass)",
              letterSpacing: "0.3em",
              textShadow: "0 0 8px rgba(230,165,89,0.4)",
            }}
          >
            DEAN ↯ INTERCOM
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 19,
              lineHeight: 1.45,
              color: "var(--pearl, #e8f1ea)",
              textShadow:
                "0 0 14px rgba(230,165,89,0.35), 0 1px 0 rgba(3,18,30,0.9)",
              animation: "lamp-flicker 3s ease-out",
            }}
          >
            {closeLine}
          </div>
        </div>
      )}

      <Link
        href={`/api/profile/brief?studentId=${encodeURIComponent(studentId)}`}
        target="_blank"
        className="absolute bottom-4 right-4 z-20 pointer-events-auto rounded-sm px-3 py-2 transition-colors"
        style={{
          background: "rgba(10,26,38,0.88)",
          border: "1px solid rgba(230,165,89,0.45)",
          color: "var(--brass)",
          fontFamily: "var(--font-hud)",
          fontSize: 13,
          letterSpacing: "0.2em",
          boxShadow:
            "inset 0 0 0 1px rgba(230,165,89,0.15), 0 0 18px rgba(230,165,89,0.12)",
        }}
        title="Pneumatic tube to the surface — student brief PDF"
      >
        ↑ SURFACE BRIEF · PDF
      </Link>
    </>
  );
}
