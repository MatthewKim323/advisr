"use client";

/**
 * EjectButton — small coral-on-hover sign-out control. Lives inside a
 * plain `<form action="/auth/signout" method="post">` so it works
 * without JS; the `onMouse*` handlers just upgrade the hover look to
 * match SurfaceButton's brass-glow language.
 */
export default function EjectButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        aria-label="Sign out — eject from the submarine"
        className="pixel-text inline-flex items-center px-2 py-1 transition-[background,color,box-shadow] duration-150"
        style={{
          color: "var(--kelp)",
          background: "transparent",
          boxShadow: "inset 0 0 0 1px rgba(94,166,135,0.35)",
          fontSize: 10,
          letterSpacing: "0.22em",
          border: 0,
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = "var(--coral)";
          el.style.boxShadow =
            "inset 0 0 0 1px rgba(255,117,87,0.6), 0 0 12px rgba(255,117,87,0.18)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = "var(--kelp)";
          el.style.boxShadow = "inset 0 0 0 1px rgba(94,166,135,0.35)";
        }}
      >
        EJECT
      </button>
    </form>
  );
}
