"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * HailButton — kicks off the Google OAuth handshake.
 *
 * Visually: a brass-framed pill matching the `SurfaceButton` language in
 * [components/office/scene/DepthHUD.tsx], oversized for the dedicated
 * hail screen. A pixel-art Google "G" replaces the SURFACE arrow; the
 * Silkscreen label reads "HAIL BATHYSPHERE-7". On click we lift off into
 * Supabase's PKCE redirect flow.
 */
export default function HailButton({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function hail() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Handshake failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={hail}
        disabled={loading}
        aria-label="Hail Bathysphere-7 with your Google account"
        className="group relative inline-flex items-center gap-3 px-6 py-3 transition-[background,box-shadow,transform] duration-200 disabled:cursor-wait"
        style={{
          color: "var(--brass)",
          background: "rgba(10,26,38,0.82)",
          boxShadow:
            "inset 0 0 0 1px rgba(230,165,89,0.55), inset 0 0 0 3px rgba(10,26,38,1), 0 0 0 0 rgba(230,165,89,0)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "inset 0 0 0 1px rgba(230,165,89,0.95), inset 0 0 0 3px rgba(10,26,38,1), 0 0 32px rgba(230,165,89,0.45)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "inset 0 0 0 1px rgba(230,165,89,0.55), inset 0 0 0 3px rgba(10,26,38,1), 0 0 0 0 rgba(230,165,89,0)";
        }}
      >
        <GoogleGlyph />
        <span
          className="pixel-text"
          style={{ fontSize: 14, letterSpacing: "0.22em" }}
        >
          {loading ? "HAILING…" : "HAIL BATHYSPHERE-7"}
        </span>
      </button>

      {error ? (
        <span
          className="hud-text"
          style={{ color: "var(--coral)", fontSize: 15, letterSpacing: "0.1em" }}
        >
          /// {error.toUpperCase()}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Pixel-art "G" — 10x10 grid so it sits alongside the Silkscreen label
 * at the same crispness as the SURFACE arrow. Drawn as solid brass rects
 * so it reads as part of the sub hardware, not a pasted-in Google mark.
 */
function GoogleGlyph() {
  const b = "var(--brass)";
  return (
    <svg
      viewBox="0 0 10 10"
      width={14}
      height={14}
      aria-hidden
      style={{ imageRendering: "pixelated" }}
    >
      <rect x={3} y={1} width={4} height={1} fill={b} />
      <rect x={2} y={2} width={1} height={6} fill={b} />
      <rect x={7} y={2} width={1} height={2} fill={b} />
      <rect x={3} y={8} width={4} height={1} fill={b} />
      <rect x={7} y={6} width={1} height={2} fill={b} />
      <rect x={5} y={5} width={3} height={1} fill={b} />
    </svg>
  );
}
