import Canvas from "@/components/office/Canvas";
import ChatPanel from "@/components/chat/ChatPanel";

/**
 * /office — the main student-facing experience.
 *
 * Layout: PixiJS canvas on the left, chat panel on the right, file-drop
 * zone baked into the canvas itself. Subscribes to the event bus and
 * animates every agent action.
 */
export default function OfficePage() {
  return (
    <main className="grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-screen">
      <Canvas />
      <ChatPanel />
    </main>
  );
}
