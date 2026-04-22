/**
 * Same-origin navigation into the submarine (/office). Marketing and product
 * share one Next.js app in dev and prod — no second port.
 *
 * Optional: set NEXT_PUBLIC_NAMI_OFFICE_URL to override the href (e.g. preview URL).
 *
 * ---------------------------------------------------------------------------
 * Dive loader: when a user clicks any CTA that lands here, we don't just
 * hard-navigate. We mount a fullscreen overlay with bubbles rising from the
 * bottom of the screen to the top — the visual metaphor is "we're going
 * under, the bubbles are the air escaping as we descend." After the dive
 * animation completes, we navigate.
 *
 * Why imperative (not a React overlay)?
 *   - `diveToOffice` is a vanilla function anyone can import and call from
 *     onClick handlers across the landing page. No provider wiring needed.
 *   - The overlay only exists during the transition, so it has no business
 *     being mounted in the React tree at rest.
 *   - Styles are injected once via a <style> tag; the DOM nodes clean up
 *     themselves when the page navigates.
 * ---------------------------------------------------------------------------
 */

const DEMO_QUERY = "?demo=maria";

/** Total time the overlay is up before we hard-navigate. */
const DIVE_DURATION_MS = 1700;
/** Number of bubbles. Enough to feel dense, not so many that it janks. */
const DIVE_BUBBLE_COUNT = 42;
const DIVE_STYLE_ID = "nami-dive-loader-style";

let diving = false;

export function getOfficeUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_NAMI_OFFICE_URL;
  if (typeof explicit === "string" && explicit.trim().length > 0) {
    return explicit.trim();
  }
  return `/office${DEMO_QUERY}`;
}

function injectDiveStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(DIVE_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = DIVE_STYLE_ID;
  style.textContent = `
    @keyframes nami-dive-fadein {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes nami-dive-rise {
      0%   { transform: translate3d(0, 0, 0) scale(0.35); opacity: 0; }
      12%  { opacity: 0.95; }
      60%  { opacity: 0.75; }
      100% { transform: translate3d(var(--drift, 40px), -120vh, 0) scale(1.25); opacity: 0; }
    }
    @keyframes nami-dive-caption-in {
      0%   { opacity: 0; transform: translateY(10px); letter-spacing: 0.1em; }
      60%  { opacity: 1; transform: translateY(0);    letter-spacing: 0.22em; }
      100% { opacity: 1; transform: translateY(0);    letter-spacing: 0.22em; }
    }
    @keyframes nami-dive-dot-pulse {
      0%, 100% { opacity: 1;    transform: scale(1); }
      50%      { opacity: 0.35; transform: scale(0.65); }
    }
    @keyframes nami-dive-bar {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }

    .nami-dive-loader {
      position: fixed;
      inset: 0;
      z-index: 99999;
      overflow: hidden;
      background:
        radial-gradient(ellipse at 50% 110%, rgba(77,216,211,0.09) 0%, transparent 55%),
        linear-gradient(180deg, #020812 0%, #05101c 45%, #030b15 100%);
      animation: nami-dive-fadein 320ms ease-out both;
      pointer-events: all;
      cursor: wait;
    }

    /* a soft radial vignette — makes the bubbles read as "through water" */
    .nami-dive-loader::after {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center,
        transparent 30%,
        rgba(2,8,18,0.55) 80%,
        rgba(2,8,18,0.9) 100%);
      pointer-events: none;
    }

    .nami-dive-bubble {
      position: absolute;
      bottom: -60px;
      left: var(--x, 50%);
      width: var(--sz, 8px);
      height: var(--sz, 8px);
      border-radius: 50%;
      background: radial-gradient(
        circle at 30% 28%,
        rgba(255,255,255,0.85),
        rgba(198,237,235,0.35) 45%,
        rgba(77,216,211,0.08) 75%,
        transparent 100%
      );
      box-shadow:
        inset 0 0 8px rgba(255,255,255,0.25),
        0 0 14px rgba(77,216,211,0.12);
      opacity: 0;
      filter: blur(var(--blur, 0.4px));
      animation: nami-dive-rise var(--dur, 1.6s) cubic-bezier(0.25, 0.45, 0.35, 1) var(--dly, 0s) forwards;
      will-change: transform, opacity;
    }

    .nami-dive-caption {
      position: absolute;
      inset: 0;
      display: grid;
      place-content: center;
      text-align: center;
      color: #eaf6f5;
      pointer-events: none;
      animation: nami-dive-caption-in 900ms cubic-bezier(0.2, 0.7, 0.2, 1) 180ms both;
    }

    .nami-dive-chip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      margin: 0 auto 18px;
      border: 1px solid rgba(77,216,211,0.45);
      border-radius: 2px;
      background: rgba(8,16,26,0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      font-family: "JetBrains Mono", "Courier New", monospace;
      font-size: 11px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: rgba(77,216,211,0.92);
      box-shadow:
        inset 0 0 0 1px rgba(2,8,18,1),
        0 0 20px rgba(77,216,211,0.18);
    }
    .nami-dive-chip-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #4dd8d3;
      box-shadow: 0 0 10px rgba(77,216,211,0.85);
      animation: nami-dive-dot-pulse 0.9s ease-in-out infinite;
    }

    .nami-dive-title {
      font-family: "PP Mondwest", "Newsreader", Georgia, serif;
      font-size: clamp(40px, 7vw, 84px);
      line-height: 0.96;
      color: #ffffff;
      text-shadow: 0 2px 30px rgba(2,8,18,0.6);
      word-spacing: 0.06em;
      margin-bottom: 28px;
    }
    .nami-dive-sub {
      font-family: "JetBrains Mono", "Courier New", monospace;
      font-size: 12px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: rgba(234,246,245,0.55);
      margin-bottom: 26px;
    }

    .nami-dive-bar {
      position: relative;
      width: min(320px, 52vw);
      margin: 0 auto;
      height: 2px;
      background: rgba(77,216,211,0.12);
      border-radius: 2px;
      overflow: hidden;
    }
    .nami-dive-bar::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg,
        rgba(77,216,211,0.2),
        #4dd8d3 60%,
        #c6edeb);
      transform-origin: left center;
      transform: scaleX(0);
      box-shadow: 0 0 10px rgba(77,216,211,0.6);
      animation: nami-dive-bar ${DIVE_DURATION_MS}ms cubic-bezier(0.4, 0.0, 0.2, 1) both;
    }

    @media (prefers-reduced-motion: reduce) {
      .nami-dive-loader { animation: none; }
      .nami-dive-bubble { animation: none; opacity: 0; }
      .nami-dive-chip-dot { animation: none; }
      .nami-dive-caption { animation: none; }
      .nami-dive-bar::after { animation: none; transform: scaleX(0.5); }
    }
  `;
  document.head.appendChild(style);
}

function buildDiveOverlay(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "nami-dive-loader";
  overlay.setAttribute("role", "progressbar");
  overlay.setAttribute("aria-label", "Diving to the submarine — please wait");
  overlay.setAttribute("aria-busy", "true");

  // Deterministic-enough randomness. We don't need crypto here, just
  // something that feels chaotic. Math.random is fine because this only
  // runs on a click and each dive is independent.
  for (let i = 0; i < DIVE_BUBBLE_COUNT; i++) {
    const b = document.createElement("span");
    b.className = "nami-dive-bubble";
    // Stratify sizes so we get a mix of foreground / background bubbles —
    // this is what sells the sense of depth.
    const sizeBucket = Math.random();
    const sz =
      sizeBucket < 0.55
        ? 4 + Math.random() * 8        // small, distant
        : sizeBucket < 0.9
        ? 10 + Math.random() * 14      // mid
        : 22 + Math.random() * 22;     // large, close to camera
    const x = Math.random() * 100;
    const dur = 1.2 + Math.random() * 1.3;         // 1.2 – 2.5s
    const dly = Math.random() * 0.9;               // staggered
    const drift = (Math.random() - 0.5) * 140;     // -70 → +70px sideways
    const blur = sz < 10 ? 1.2 : sz < 24 ? 0.4 : 0;

    b.style.cssText =
      `--sz:${sz.toFixed(1)}px;` +
      `--x:${x.toFixed(1)}%;` +
      `--dur:${dur.toFixed(2)}s;` +
      `--dly:${dly.toFixed(2)}s;` +
      `--drift:${drift.toFixed(0)}px;` +
      `--blur:${blur}px;`;
    overlay.appendChild(b);
  }

  const caption = document.createElement("div");
  caption.className = "nami-dive-caption";
  caption.innerHTML = `
    <div>
      <div class="nami-dive-chip">
        <span class="nami-dive-chip-dot" aria-hidden="true"></span>
        <span>Bathysphere // descending</span>
      </div>
      <div class="nami-dive-title">we&rsquo;re going under.</div>
      <div class="nami-dive-sub">hatch sealed &middot; crew on station</div>
      <div class="nami-dive-bar" aria-hidden="true"></div>
    </div>
  `;
  overlay.appendChild(caption);

  return overlay;
}

/**
 * Mount the dive loader, then navigate. Subsequent clicks during a dive are
 * ignored so we don't stack overlays.
 */
export function diveToOffice(): void {
  if (typeof window === "undefined") return;
  if (diving) return;
  diving = true;

  injectDiveStyles();
  const overlay = buildDiveOverlay();
  document.body.appendChild(overlay);

  window.setTimeout(() => {
    window.location.href = getOfficeUrl();
  }, DIVE_DURATION_MS);
}
