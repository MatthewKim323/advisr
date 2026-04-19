import Canvas from "@/components/office/Canvas";
import ChatPanel from "@/components/chat/ChatPanel";
import DepthHUD from "@/components/office/scene/DepthHUD";
import Bubbles from "@/components/office/scene/Bubbles";

/**
 * /office — Bathysphere-7. The student-facing experience.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────┐
 *   │              DEPTH HUD (top)                         │
 *   ├──────────────────────────────┬───────────────────────┤
 *   │                              │                       │
 *   │        THE SUBMARINE          │        COMMS         │
 *   │          (Canvas)             │      (ChatPanel)     │
 *   │                              │                       │
 *   ├──────────────────────────────┴───────────────────────┤
 *   │              DEPTH HUD (bottom, fixed)               │
 *   └──────────────────────────────────────────────────────┘
 *
 * Bubbles render on a fixed overlay so they hug the whole viewport gutter.
 */
export default function OfficePage() {
  return (
    <main
      className="relative flex min-h-screen flex-col"
      style={{ background: "var(--abyss-deep)" }}
    >
      <DepthHUD />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_420px]">
        <Canvas />
        <ChatPanel />
      </div>

      <Bubbles />
    </main>
  );
}
