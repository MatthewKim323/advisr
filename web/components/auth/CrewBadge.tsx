import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EjectButton from "./EjectButton";

/**
 * CrewBadge — who's at the helm?
 *
 * Server component. Reads the Supabase user server-side so the top bar
 * renders with the correct state on first paint (no auth-flicker).
 *
 * - Unauthed  → brass HAIL pill that links to /hail (mirrors SURFACE
 *   styling in DepthHUD so the two controls feel like siblings).
 * - Authed    → CRT chip "CREW: <handle>" alongside a small client-side
 *   EJECT button that POSTs to /auth/signout.
 */
export default async function CrewBadge() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/hail"
        aria-label="Hail the submarine — sign in"
        className="inline-flex items-center gap-1.5 px-2.5 py-1"
        style={{
          color: "var(--brass)",
          textDecoration: "none",
          background: "rgba(10,26,38,0.7)",
          boxShadow:
            "inset 0 0 0 1px rgba(230,165,89,0.45), inset 0 0 0 2px rgba(10,26,38,1)",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--brass)",
            boxShadow: "0 0 6px var(--brass)",
            display: "inline-block",
            animation: "lamp-flicker 2.4s infinite",
          }}
        />
        <span
          className="pixel-text"
          style={{ fontSize: 10, letterSpacing: "0.22em" }}
        >
          HAIL
        </span>
      </Link>
    );
  }

  const handle = deriveHandle(user.user_metadata, user.email);

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="hud-text inline-flex items-center gap-2 px-2 py-1"
        style={{
          color: "var(--sonar)",
          background: "rgba(10,26,38,0.7)",
          boxShadow:
            "inset 0 0 0 1px rgba(124,255,147,0.25), inset 0 0 0 2px rgba(10,26,38,1)",
          fontSize: 14,
          letterSpacing: "0.14em",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--sonar)",
            boxShadow: "0 0 6px var(--sonar)",
            display: "inline-block",
          }}
        />
        <span style={{ color: "var(--kelp)" }}>CREW</span>
        <span>{handle}</span>
      </span>

      <EjectButton />
    </span>
  );
}

function deriveHandle(
  meta: Record<string, unknown> | null | undefined,
  email: string | undefined,
) {
  const fullName =
    typeof meta?.full_name === "string" ? (meta.full_name as string) : null;
  const name = typeof meta?.name === "string" ? (meta.name as string) : null;
  const given =
    typeof meta?.given_name === "string" ? (meta.given_name as string) : null;

  const candidate = given || fullName || name || email || "ENSIGN";
  const first = candidate.split(/[\s@]/)[0] || candidate;
  return first.toUpperCase().slice(0, 16);
}
