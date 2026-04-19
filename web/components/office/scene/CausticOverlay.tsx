"use client";

/**
 * CausticOverlay — underwater light patterns flickering across the sub floor.
 *
 * Uses SVG turbulence to generate organic caustic shapes, then animates a
 * subtle drift so it feels like light filtered through water above.
 * Absolute-positioned, non-interactive, sits below everything else.
 */
export default function CausticOverlay() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{
        mixBlendMode: "screen",
        animation: "caustic-drift 12s ease-in-out infinite",
      }}
    >
      <defs>
        <filter id="caustic-filter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.016 0.022"
            numOctaves="2"
            seed="7"
          />
          <feColorMatrix
            values="
              0 0 0 0 0.3
              0 0 0 0 0.85
              0 0 0 0 0.83
              0 0 0 1 0
            "
          />
          <feComponentTransfer>
            <feFuncA type="gamma" amplitude="2.4" exponent="3.8" offset="0" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#caustic-filter)" opacity="0.55" />
    </svg>
  );
}
