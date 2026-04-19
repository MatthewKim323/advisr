"use client";

/**
 * The chat with Dean. Uses Vercel AI SDK's useChat hook against /api/chat.
 * Dean's tool calls stream in as special message parts so we can render
 * "→ delegating to Match-Maker" inline.
 */
export default function ChatPanel() {
  // TODO: useChat({ api: "/api/chat" }); render messages + tool invocations.
  return (
    <aside className="border-l border-[#f1e4c5]/10 p-6 font-mono text-xs text-[#f1e4c5]/40">
      // chat.panel — useChat here
    </aside>
  );
}
