/**
 * CrewBadge — demo build.
 *
 * The real version called supabase.auth.getUser() and branched between a
 * HAIL link (unauthed) and a CREW chip (authed). For the HD demo we've
 * yanked auth entirely, so this now renders a static DEMO chip that
 * matches the sonar-green CREW styling.
 *
 * Kept as a server component (no "use client") so callers don't have to
 * change — just a zero-I/O sync render now. Restore git history for the
 * full auth variant when auth comes back.
 */
export default function CrewBadge() {
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
        <span style={{ color: "var(--kelp)" }}>DEMO</span>
        <span>MARIA</span>
      </span>
    </span>
  );
}
