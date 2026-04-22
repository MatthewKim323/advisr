"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * LoadingScreen — bathysphere dive sequence.
 *
 * Inspired by stephenhungg/iris's ascii scramble loader:
 *   - Each row of the submarine scrambles through punctuation garbage
 *     before settling into its real characters. Gives the reveal weight.
 *   - Progress uses a staged ease: fast 0 → 72, slower 72 → 92,
 *     crawl 92 → 100. Feels like the hull is actually hard to finish.
 *   - Total on-screen time is ~5.2s so there's room to read it, then a
 *     beat where the completed sub glows before the fade hands off.
 *
 * No WebGL, no shaders. Just CSS + a single rAF loop that drives:
 *   1. `progress` — the 0-100 readout
 *   2. `frame` — a monotonic timestamp that forces a rerender every
 *      tick, so the character scramble actually animates
 *   3. `revealedAtRef` — per-row wall-clock times, used to compute a
 *      scramble age independent of when React happens to rerender
 */

const SUBMARINE_ROWS: readonly string[] = [
  "                              ___                           ",
  "                             |   |                          ",
  "                             |___|                          ",
  "                 ____________/   \\_____________             ",
  "                /  .   .   .       .   .   .    \\           ",
  "    ___________/                                  \\________ ",
  "   /                                                       \\",
  "   |   o      o      o      o      o      o      o         |",
  "   \\_______________________________________________________/",
  "       | |                                              | | ",
  "       \\_/                                              \\_/ ",
  "    ~   ~   ~   ~    ~    ~   ~   ~    ~   ~   ~   ~   ~   ~",
];

/* Timing ──────────────────────────────────────────────── */
const BUILD_MS = 3800;
const HOLD_MS = 900;
const FADE_MS = 700;
const SCRAMBLE_MS = 460;

/* Noise alphabet for the scramble phase. Keep it dense so we never
 * see the same symbol flash twice in a frame (feels glitchy vs. noisy). */
const SCRAMBLE_CHARS = "·.+*%#@~=/\\|░▒▓:;?!<>";

/** Title line that scrambles in at the very top of the sequence. */
const TITLE_TEXT = "INITIATING DIVE SEQUENCE";

function scrambleChar(real: string, t: number): string {
  if (real === " ") return " ";
  if (t >= 1) return real;
  // Bias toward the real char as t climbs — hand-tuned constant, feels
  // snappy at first and locks in cleanly near the end.
  if (Math.random() < t * 1.08) return real;
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function scrambleLine(line: string, age: number): string {
  const t = Math.min(1, age / SCRAMBLE_MS);
  let out = "";
  for (let i = 0; i < line.length; i++) out += scrambleChar(line[i], t);
  return out;
}

/* Staged progress curve — modelled on the iris loader's tick rule.
 * Fast ramp, then two deceleration phases. Returns 0-100. */
function computeProgress(elapsedMs: number): number {
  const t = Math.min(1, elapsedMs / BUILD_MS);
  let eased: number;
  if (t < 0.55) {
    eased = (t / 0.55) * 0.72;
  } else if (t < 0.85) {
    eased = 0.72 + ((t - 0.55) / 0.3) * 0.21;
  } else {
    eased = 0.93 + ((t - 0.85) / 0.15) * 0.07;
  }
  return Math.min(100, Math.round(eased * 100));
}

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  // `frame` is a timestamp that advances every rAF, forcing a rerender
  // so the scramble actually animates in between integer progress bumps.
  const [frame, setFrame] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  // Scramble uses Math.random → must be client-only to avoid hydration
  // mismatches. Keep the SSR output as null and let the client mount it.
  const [mounted, setMounted] = useState(false);

  const startRef = useRef(0);
  const revealedAtRef = useRef<number[]>(
    new Array(SUBMARINE_ROWS.length).fill(0),
  );
  const titleRevealedAtRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    startRef.current = performance.now();
    titleRevealedAtRef.current = startRef.current;
    let raf = 0;

    const step = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = computeProgress(elapsed);
      setProgress(pct);

      // Any row whose "intro threshold" has been crossed gets its
      // reveal timestamp stamped exactly once. Rows reveal slightly
      // before their progress number would suggest (off-by-one bias
      // so the latest row is always actively scrambling).
      const rowsShouldShow = Math.min(
        SUBMARINE_ROWS.length,
        Math.floor((pct / 100) * SUBMARINE_ROWS.length) + (pct < 100 ? 1 : 0),
      );
      for (let i = 0; i < rowsShouldShow; i++) {
        if (revealedAtRef.current[i] === 0) revealedAtRef.current[i] = now;
      }

      setFrame(now);

      if (elapsed < BUILD_MS) {
        raf = requestAnimationFrame(step);
      } else {
        // Final sweep — guarantee every row is settled.
        for (let i = 0; i < SUBMARINE_ROWS.length; i++) {
          if (revealedAtRef.current[i] === 0) revealedAtRef.current[i] = now;
        }
        setProgress(100);
      }
    };
    raf = requestAnimationFrame(step);

    const fadeT = window.setTimeout(
      () => setIsVisible(false),
      BUILD_MS + HOLD_MS,
    );
    const doneT = window.setTimeout(
      () => onComplete(),
      BUILD_MS + HOLD_MS + FADE_MS,
    );

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeT);
      window.clearTimeout(doneT);
    };
  }, [onComplete]);

  // Render each row with its current scramble state.
  const renderedRows = useMemo(() => {
    return SUBMARINE_ROWS.map((line, i) => {
      const revealedAt = revealedAtRef.current[i];
      if (revealedAt === 0) return { text: "", settled: false };
      const age = frame - revealedAt;
      const settled = age >= SCRAMBLE_MS;
      return {
        text: settled ? line : scrambleLine(line, age),
        settled,
      };
    });
  }, [frame]);

  const titleAge = frame - titleRevealedAtRef.current;
  const titleText =
    titleAge >= SCRAMBLE_MS * 1.4
      ? TITLE_TEXT
      : scrambleLine(TITLE_TEXT, titleAge * 0.75);

  const pct = String(progress).padStart(3, "0");
  const rivets = String(Math.round((progress / 100) * 847)).padStart(3, "0");
  const bar = useMemo(() => buildBar(progress, 40), [progress]);
  const bootLine = pickBootLine(progress);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
          style={styles.root}
          role="status"
          aria-label={`Boot sequence ${progress} percent`}
        >
          <div style={styles.vignette} aria-hidden />
          <div style={styles.scanlines} aria-hidden />

          <div style={styles.stage}>
            <div style={styles.marque}>
              <span style={styles.marqueDot} />
              BATHYSPHERE&nbsp;·&nbsp;CORE&nbsp;7
              <span style={styles.marqueDot} />
            </div>

            <div style={styles.title}>{titleText}</div>

            <pre style={styles.art} aria-hidden>
              {renderedRows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    opacity: row.text ? 1 : 0,
                    color: row.settled
                      ? "rgba(173,226,220,0.88)"
                      : "#e6a559",
                    textShadow: row.settled
                      ? "0 0 10px rgba(77,216,211,0.22)"
                      : "0 0 14px rgba(230,165,89,0.7), 0 0 2px rgba(230,165,89,0.95)",
                    transition: row.settled
                      ? "color 380ms ease, text-shadow 380ms ease"
                      : "none",
                    whiteSpace: "pre",
                  }}
                >
                  {row.text || " "}
                </div>
              ))}
            </pre>

            <div style={styles.readout}>
              <div style={styles.readoutRow}>
                <span style={styles.label}>ASSEMBLY</span>
                <span style={styles.bar}>{bar}</span>
                <span style={styles.pct}>{pct}%</span>
              </div>
              <div style={styles.readoutMeta}>
                <span>HULL&nbsp;·&nbsp;{rivets}&nbsp;rivets</span>
                <span style={styles.cursorLine}>
                  <span style={styles.arrow}>›</span>
                  {bootLine}
                  <span style={styles.caret}>▊</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function buildBar(progress: number, width: number): string {
  const filled = Math.round((progress / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function pickBootLine(progress: number): string {
  if (progress < 6) return "pressurising hull · bolts sealed";
  if (progress < 16) return "periscope · rising";
  if (progress < 28) return "conning tower · aligned";
  if (progress < 42) return "deck plates · torqued";
  if (progress < 58) return "portholes · lit";
  if (progress < 72) return "ballast · flooding";
  if (progress < 86) return "keel fins · deployed";
  if (progress < 96) return "hull · checked";
  if (progress < 100) return "diving · clear";
  return "crew on station";
}

const FACE_MONO: React.CSSProperties = {
  fontFamily:
    '"Syne Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  fontFeatureSettings: '"ss01" on, "ss02" on',
  letterSpacing: 0,
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background:
      "radial-gradient(120% 80% at 50% 40%, #0b1b2e 0%, #05101c 55%, #03080f 100%)",
    color: "rgba(173,226,220,0.82)",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(60% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.68) 100%)",
  },
  scanlines: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    mixBlendMode: "overlay",
    background:
      "repeating-linear-gradient(0deg, rgba(77,216,211,0.04) 0px, rgba(77,216,211,0.04) 1px, transparent 1px, transparent 3px)",
    animation: "nami-scan 6s linear infinite",
  },
  stage: {
    ...FACE_MONO,
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    padding: "48px 24px",
  },
  marque: {
    ...FACE_MONO,
    fontSize: 11,
    letterSpacing: "0.42em",
    color: "#e6a559",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 14,
    textShadow: "0 0 12px rgba(230,165,89,0.4)",
  },
  marqueDot: {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#e6a559",
    boxShadow: "0 0 10px rgba(230,165,89,0.9)",
    animation: "nami-pulse 1.4s ease-in-out infinite",
  },
  title: {
    ...FACE_MONO,
    color: "rgba(244,233,212,0.92)",
    fontSize: 13,
    letterSpacing: "0.5em",
    textTransform: "uppercase",
    marginBottom: 4,
    textShadow: "0 0 14px rgba(77,216,211,0.3)",
  },
  art: {
    ...FACE_MONO,
    margin: 0,
    fontSize: "clamp(10px, 1.15vw, 15px)",
    lineHeight: 1.14,
    whiteSpace: "pre",
    tabSize: 1,
  },
  readout: {
    ...FACE_MONO,
    marginTop: 6,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 560,
    maxWidth: "92vw",
  },
  readoutRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: 13,
    letterSpacing: "0.08em",
  },
  label: {
    color: "#e6a559",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    fontSize: 11,
  },
  bar: {
    color: "#4dd8d3",
    textShadow: "0 0 8px rgba(77,216,211,0.45)",
    fontSize: 13,
    flex: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  pct: {
    color: "#f4e9d4",
    fontVariantNumeric: "tabular-nums",
    fontSize: 13,
    minWidth: 56,
    textAlign: "right",
  },
  readoutMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    fontSize: 11,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(173,226,220,0.55)",
  },
  cursorLine: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(173,226,220,0.72)",
  },
  arrow: {
    color: "#e6a559",
    fontSize: 13,
  },
  caret: {
    display: "inline-block",
    color: "#e6a559",
    animation: "nami-caret 0.9s steps(1) infinite",
    marginLeft: 2,
  },
};

if (
  typeof document !== "undefined" &&
  !document.getElementById("nami-loader-kf")
) {
  const style = document.createElement("style");
  style.id = "nami-loader-kf";
  style.textContent = `
    @keyframes nami-pulse {
      0%, 100% { opacity: 0.35; transform: scale(0.8); }
      50%      { opacity: 1;    transform: scale(1.15); }
    }
    @keyframes nami-caret {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    @keyframes nami-scan {
      0%   { background-position: 0 0; }
      100% { background-position: 0 24px; }
    }
  `;
  document.head.appendChild(style);
}
