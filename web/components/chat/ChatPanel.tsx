"use client";

/**
 * ChatPanel — the comms console. Conversation with Dean styled as submarine
 * intercom traffic. Phase 1+ wires this to `useChat({ api: "/api/chat" })`
 * and renders tool-calls inline as delegation lines.
 *
 * Current render: styled dormant console with a blinking cursor prompt, a few
 * system lines seeded for atmosphere, and a submit form that isn't wired.
 */

export default function ChatPanel() {
  return (
    <aside
      className="relative flex h-screen flex-col border-l"
      style={{
        borderColor: "rgba(77,216,211,0.15)",
        background:
          "linear-gradient(180deg, rgba(10,26,38,0.95) 0%, rgba(3,18,30,0.98) 100%)",
      }}
    >
      {/* Header — comms station placard */}
      <div
        className="flex items-baseline justify-between border-b px-5 py-4"
        style={{ borderColor: "rgba(77,216,211,0.12)" }}
      >
        <div>
          <div
            className="pixel-text"
            style={{ fontSize: 10, color: "var(--brass)", letterSpacing: "0.22em" }}
          >
            COMMS — STATION 01
          </div>
          <div
            className="hud-text mt-1"
            style={{ fontSize: 20, color: "var(--sonar)", letterSpacing: "0.1em" }}
          >
            DEAN &gt; INTERCOM
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block rounded-full"
            style={{
              width: 6, height: 6,
              background: "var(--sonar)",
              boxShadow: "0 0 6px var(--sonar)",
              animation: "lamp-flicker 2.5s infinite",
            }}
          />
          <span
            className="hud-text"
            style={{ fontSize: 13, color: "var(--kelp)", letterSpacing: "0.14em" }}
          >
            LINE OPEN
          </span>
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <Line kind="sys">— intercom primed · encryption ok · graph: 0 claims</Line>
        <Line kind="sys">— hatch sealed · awaiting file drop</Line>
        <Line kind="sys">— dean is on station and will hail when you board</Line>
        <div className="mt-6" />
        <Line kind="dean">
          Come in. I've read your files before you dropped them — that's just
          what we do down here. Whenever you're ready, tell me what you're
          working on and I'll pull the right specialist.
        </Line>
      </div>

      {/* Input — mock; wire to useChat later */}
      <form
        className="border-t px-5 py-4"
        style={{ borderColor: "rgba(77,216,211,0.12)" }}
        onSubmit={(e) => e.preventDefault()}
      >
        <div
          className="flex items-center gap-2 rounded-sm px-3 py-2"
          style={{
            background: "rgba(3,18,30,0.9)",
            boxShadow:
              "0 0 0 1px rgba(77,216,211,0.25) inset, 0 0 12px rgba(77,216,211,0.08)",
          }}
        >
          <span
            className="hud-text"
            style={{ color: "var(--brass)", fontSize: 16 }}
          >
            YOU &gt;
          </span>
          <input
            placeholder="hail dean…"
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-hud)",
              fontSize: 18,
              color: "var(--foam)",
              letterSpacing: "0.04em",
            }}
          />
          <span
            aria-hidden
            style={{
              width: 8,
              height: 18,
              background: "var(--sonar)",
              boxShadow: "0 0 6px var(--sonar)",
              animation: "cursor-blink 1s steps(2) infinite",
            }}
          />
        </div>
        <div
          className="hud-text mt-2 flex items-center justify-between"
          style={{ fontSize: 13, color: "var(--kelp)", letterSpacing: "0.18em" }}
        >
          <span>ENTER · TRANSMIT</span>
          <span>SHIFT+ENTER · NEW LINE</span>
        </div>
      </form>
    </aside>
  );
}

function Line({
  kind,
  children,
}: {
  kind: "sys" | "dean" | "you";
  children: React.ReactNode;
}) {
  if (kind === "sys") {
    return (
      <div
        className="hud-text mb-1"
        style={{ fontSize: 14, color: "var(--kelp)", letterSpacing: "0.04em" }}
      >
        {children}
      </div>
    );
  }
  if (kind === "dean") {
    return (
      <div className="mb-4">
        <div
          className="pixel-text mb-1"
          style={{ fontSize: 9, color: "var(--brass)", letterSpacing: "0.18em" }}
        >
          DEAN ↯
        </div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.55,
            color: "var(--foam)",
          }}
        >
          {children}
        </p>
      </div>
    );
  }
  return (
    <div className="mb-4">
      <div
        className="pixel-text mb-1"
        style={{ fontSize: 9, color: "var(--sonar)", letterSpacing: "0.18em" }}
      >
        YOU ↯
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--foam)" }}>
        {children}
      </p>
    </div>
  );
}
