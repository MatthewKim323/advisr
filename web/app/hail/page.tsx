import { redirect } from "next/navigation";
import Bubbles from "@/components/office/scene/Bubbles";
import { createClient } from "@/lib/supabase/server";
import HailButton from "./HailButton";

type Search = { next?: string; error?: string };

/**
 * /hail — the airlock. Unauthenticated users land here; the submarine is
 * on the other side. A single Google OAuth handshake and they're through.
 *
 * Already-signed-in users get bounced straight to `next` (or /office) so
 * bookmarking /hail doesn't strand them outside their own sub.
 */
export default async function HailPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { next = "/office", error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(next || "/office");

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, var(--abyss-glow) 0%, var(--abyss) 45%, var(--abyss-deep) 100%)",
      }}
    >
      <Scanlines />
      <Bubbles />

      <div className="relative z-30 flex flex-col items-center gap-10 px-6 text-center">
        <header className="flex flex-col items-center gap-3">
          <span
            className="pixel-text"
            style={{
              color: "var(--brass)",
              fontSize: 11,
              letterSpacing: "0.32em",
            }}
          >
            NAMI // BATHYSPHERE-7
          </span>
          <h1
            className="hud-text"
            style={{
              color: "var(--sonar)",
              fontSize: 40,
              letterSpacing: "0.16em",
              textShadow:
                "0 0 8px rgba(124,255,147,0.35), 0 0 18px rgba(124,255,147,0.15)",
            }}
          >
            HAILING FREQUENCY OPEN
          </h1>
          <p
            style={{
              color: "var(--pearl)",
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              fontSize: 17,
              maxWidth: 520,
              lineHeight: 1.4,
              opacity: 0.78,
            }}
          >
            Identify yourself to the crew. Once the hatch seals behind you,
            seven specialists are standing by to counsel your descent.
          </p>
        </header>

        <div className="relative flex items-center justify-center py-8">
          <SonarPing />
          <HailButton next={next} />
        </div>

        <footer
          className="hud-text"
          style={{
            color: "var(--kelp)",
            fontSize: 13,
            letterSpacing: "0.22em",
          }}
        >
          {error ? (
            <span style={{ color: "var(--coral)" }}>
              CHANNEL NOISE — {decodeURIComponent(error).toUpperCase()}
            </span>
          ) : (
            <>DEPTH 2,847 FT · HULL NOMINAL · AWAITING IDENTIFICATION</>
          )}
        </footer>
      </div>
    </main>
  );
}

/**
 * Thin CRT scanline wash to sell the "looking through a periscope
 * display" feeling. Fixed-position so it sits over the entire viewport
 * without disturbing bubble z-order.
 */
function Scanlines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(124,255,147,0.035) 0px, rgba(124,255,147,0.035) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "screen",
      }}
    />
  );
}

/**
 * Concentric sonar rings that pulse outward behind the button. Pure CSS
 * via the shared `sonar-pulse` keyframe already defined in globals.css.
 */
function SonarPing() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            border: "1px solid rgba(77,216,211,0.45)",
            animation: "sonar-pulse 3.6s ease-out infinite",
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}
    </div>
  );
}
