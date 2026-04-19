"use client";

import { useEffect, useState } from "react";

/**
 * DepthHUD — top + bottom frames showing sub vitals.
 *
 * Top bar: station identity, depth, heading, pressure, mission clock
 * Bottom bar: crew status (all 7 agents), current mission, sonar indicator
 *
 * All VT323 for that CRT-green submarine readout feel.
 */
export default function DepthHUD() {
  const clock = useMissionClock();

  return (
    <>
      {/* Top bar */}
      <div
        className="hud-text relative z-30 flex items-center justify-between gap-6 border-b px-6 py-2"
        style={{
          borderColor: "rgba(77,216,211,0.15)",
          background:
            "linear-gradient(180deg, rgba(3,18,30,0.92), rgba(10,26,38,0.82))",
          color: "var(--sonar)",
          fontSize: 16,
          letterSpacing: "0.12em",
          backdropFilter: "blur(8px)",
        }}
      >
        <span style={{ color: "var(--brass)" }}>
          <span className="pixel-text" style={{ fontSize: 10, marginRight: 10, letterSpacing: "0.18em" }}>
            ADVISR
          </span>
          // BATHYSPHERE-7
        </span>

        <span className="flex items-center gap-6">
          <Metric label="DEPTH"   value="2,847 FT" />
          <Metric label="HDG"     value="214°"     />
          <Metric label="PSI"     value="1,266"    />
          <Metric label="HULL"    value="NOMINAL"  accent="sonar" />
        </span>

        <span className="flex items-center gap-3" style={{ color: "var(--bio)" }}>
          <span
            className="inline-block rounded-full"
            style={{
              width: 8,
              height: 8,
              background: "var(--sonar)",
              boxShadow: "0 0 6px var(--sonar)",
              animation: "lamp-flicker 3s infinite",
            }}
          />
          T+{clock} ZULU
        </span>
      </div>

      {/* Bottom bar — rendered fixed near the viewport bottom */}
      <div
        className="hud-text fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-6 border-t px-6 py-2"
        style={{
          borderColor: "rgba(77,216,211,0.15)",
          background:
            "linear-gradient(0deg, rgba(3,18,30,0.95), rgba(10,26,38,0.82))",
          color: "var(--kelp)",
          fontSize: 15,
          letterSpacing: "0.14em",
          backdropFilter: "blur(8px)",
        }}
      >
        <span style={{ color: "var(--bio)" }}>
          CREW 7/7 ·{" "}
          <span style={{ color: "var(--sonar)" }}>ALL STATIONS MANNED</span>
        </span>

        <span className="flex items-center gap-2" style={{ color: "var(--foam)" }}>
          <span
            className="inline-block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "var(--bio)",
              boxShadow: "0 0 6px var(--bio)",
            }}
          />
          MISSION — AWAITING STUDENT HAIL
        </span>

        <span style={{ color: "var(--brass)" }}>
          SONAR ●  GRAPH ●  HD-CORPUS ●
        </span>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  accent = "foam",
}: {
  label: string;
  value: string;
  accent?: "foam" | "sonar" | "bio" | "brass";
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span style={{ color: "var(--kelp)" }}>{label}</span>
      <span style={{ color: `var(--${accent})` }}>{value}</span>
    </span>
  );
}

/** Formats elapsed session time as HH:MM:SS. */
function useMissionClock() {
  const [t, setT] = useState(() => fmt(0));
  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => setT(fmt(Date.now() - start)), 1000);
    return () => clearInterval(iv);
  }, []);
  return t;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
}
