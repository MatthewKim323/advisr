import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * LoadingScreen — bathysphere dive sequence.
 *
 * An ASCII submarine assembles itself row-by-row while a sonar ping climbs
 * from 0 → 100. The row currently being "welded on" glows brass; earlier
 * rows settle into a quiet teal. Once the hull is complete the whole
 * sequence fades out and hands off to the marketing page.
 *
 * Design notes:
 *   - Syne Mono is the display face. It's an unusual, mechanical monospace
 *     that aligns the ASCII perfectly and looks nothing like the default
 *     Space-Mono / IBM-Plex "AI loader" feel.
 *   - No WebGL, no shaders. The whole thing is CSS + a handful of
 *     requestAnimationFrame ticks — so it actually loads fast instead of
 *     pretending to.
 *   - CRT scanlines + vignette give it the bathysphere-console look without
 *     a single raster asset.
 */

/* Each row is rendered once progress crosses a threshold. The art is
 * designed so the reveal tells a story: the periscope breaches first, the
 * tower assembles, then the hull bolts on deck-by-deck, then keel fins
 * drop, then bubbles fizz at the waterline.
 *
 * Rows MUST be strict monospace — every character pads the same grid
 * column. Escape all backslashes. */
const SUBMARINE_ROWS: readonly string[] = [
  '                              ___                           ',
  '                             |   |                          ',
  '                             |___|                          ',
  '                 ____________/   \\_____________             ',
  '                /  .   .   .       .   .   .    \\           ',
  '    ___________/                                  \\________ ',
  '   /                                                       \\',
  '   |   o      o      o      o      o      o      o         |',
  '   \\_______________________________________________________/',
  '       | |                                              | | ',
  '       \\_/                                              \\_/ ',
  '    ~   ~   ~   ~    ~    ~   ~   ~    ~   ~   ~   ~   ~   ~',
];

const BUILD_MS = 2100;
const HOLD_MS = 260;
const FADE_MS = 520;

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Drive 0 → 100 over BUILD_MS with an ease-out curve so the submarine
  // snaps together early and settles into 100 instead of a linear crawl.
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / BUILD_MS);
      const eased = 1 - Math.pow(1 - t, 2.2);
      setProgress(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(step);
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

  const revealedCount = Math.min(
    SUBMARINE_ROWS.length,
    Math.floor((progress / 100) * SUBMARINE_ROWS.length) +
      (progress >= 100 ? 0 : 1),
  );

  // Percentage + fathom readout are derived live.
  const pct = String(progress).padStart(3, '0');
  const fathoms = String(Math.round((progress / 100) * 2400)).padStart(4, '0');

  // Block-style progress bar made of unicode blocks — same monospace grid
  // as the submarine so everything sits on one rail.
  const bar = useMemo(() => buildBar(progress, 36), [progress]);

  // Boot-log lines cycle based on progress so there's something to read.
  const bootLine = pickBootLine(progress);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: 'easeInOut' }}
          style={styles.root}
          role="status"
          aria-label={`Boot sequence ${progress} percent`}
        >
          <div style={styles.vignette} aria-hidden />
          <div style={styles.scanlines} aria-hidden />

          <div style={styles.stage}>
            <div style={styles.marque}>
              <span style={styles.marqueDot} />
              BATHYSPHERE&nbsp;·&nbsp;DIVE&nbsp;SEQUENCE
              <span style={styles.marqueDot} />
            </div>

            <pre style={styles.art} aria-hidden>
              {SUBMARINE_ROWS.map((line, i) => {
                const visible = i < revealedCount;
                const isLatest = i === revealedCount - 1 && progress < 100;
                return (
                  <div
                    key={i}
                    style={{
                      opacity: visible ? 1 : 0,
                      color: isLatest ? '#e6a559' : 'rgba(173,226,220,0.82)',
                      textShadow: isLatest
                        ? '0 0 14px rgba(230,165,89,0.65), 0 0 2px rgba(230,165,89,0.9)'
                        : '0 0 10px rgba(77,216,211,0.18)',
                      transition:
                        'opacity 220ms ease-out, color 320ms ease, text-shadow 320ms ease',
                      whiteSpace: 'pre',
                    }}
                  >
                    {line || ' '}
                  </div>
                );
              })}
            </pre>

            <div style={styles.readout}>
              <div style={styles.readoutRow}>
                <span style={styles.label}>SONAR</span>
                <span style={styles.bar}>{bar}</span>
                <span style={styles.pct}>{pct}%</span>
              </div>
              <div style={styles.readoutMeta}>
                <span>{fathoms}&nbsp;fm</span>
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
};

function buildBar(progress: number, width: number): string {
  const filled = Math.round((progress / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function pickBootLine(progress: number): string {
  if (progress < 8) return 'pressurising hull · bolts sealed';
  if (progress < 22) return 'periscope · aligned';
  if (progress < 38) return 'conning tower · online';
  if (progress < 55) return 'deck plates · torqued';
  if (progress < 72) return 'portholes · lit';
  if (progress < 88) return 'ballast · flooded';
  if (progress < 100) return 'keel fins · deployed';
  return 'dive · clear';
}

const SYNE: React.CSSProperties = {
  fontFamily:
    '"Syne Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  fontFeatureSettings: '"ss01" on, "ss02" on',
  letterSpacing: 0,
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background:
      'radial-gradient(120% 80% at 50% 40%, #0b1b2e 0%, #05101c 55%, #03080f 100%)',
    color: 'rgba(173,226,220,0.82)',
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(60% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)',
  },
  scanlines: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    mixBlendMode: 'overlay',
    background:
      'repeating-linear-gradient(0deg, rgba(77,216,211,0.035) 0px, rgba(77,216,211,0.035) 1px, transparent 1px, transparent 3px)',
    animation: 'nami-scan 6s linear infinite',
  },
  stage: {
    ...SYNE,
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
    padding: '48px 24px',
  },
  marque: {
    ...SYNE,
    fontSize: 11,
    letterSpacing: '0.42em',
    color: '#e6a559',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    textShadow: '0 0 12px rgba(230,165,89,0.4)',
  },
  marqueDot: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#e6a559',
    boxShadow: '0 0 10px rgba(230,165,89,0.9)',
    animation: 'nami-pulse 1.4s ease-in-out infinite',
  },
  art: {
    ...SYNE,
    margin: 0,
    fontSize: 'clamp(10px, 1.1vw, 15px)',
    lineHeight: 1.15,
    whiteSpace: 'pre',
    tabSize: 1,
  },
  readout: {
    ...SYNE,
    marginTop: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 520,
    maxWidth: '90vw',
  },
  readoutRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    fontSize: 13,
    letterSpacing: '0.08em',
  },
  label: {
    color: '#e6a559',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  bar: {
    color: '#4dd8d3',
    textShadow: '0 0 8px rgba(77,216,211,0.45)',
    fontSize: 13,
    flex: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  pct: {
    color: '#f4e9d4',
    fontVariantNumeric: 'tabular-nums',
    fontSize: 13,
    minWidth: 56,
    textAlign: 'right',
  },
  readoutMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18,
    fontSize: 11,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'rgba(173,226,220,0.55)',
  },
  cursorLine: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color: 'rgba(173,226,220,0.72)',
  },
  arrow: {
    color: '#e6a559',
    fontSize: 13,
  },
  caret: {
    display: 'inline-block',
    color: '#e6a559',
    animation: 'nami-caret 0.9s steps(1) infinite',
    marginLeft: 2,
  },
};

// Keyframes — injected once at module load so the styled div can
// animate without pulling in another CSS layer.
if (typeof document !== 'undefined' && !document.getElementById('nami-loader-kf')) {
  const style = document.createElement('style');
  style.id = 'nami-loader-kf';
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
