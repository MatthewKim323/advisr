/**
 * POST /api/chat
 *
 * Streams Dean's response back as a UI-message stream. Body contract matches
 * what `useChat` from `@ai-sdk/react` sends by default:
 *   { id?: string, messages: UIMessage[] }
 *
 * Everything interesting — system prompt, tool definitions, event emission —
 * lives in `@agents/runtime`. This file is just the HTTP seam.
 */

import { runDeanStream } from "@agents/runtime";
import type { UIMessage } from "ai";

// The humandelta SDK + our tools use Node-only APIs (fetch with FormData,
// multipart boundary handling). Force Node runtime.
export const runtime = "nodejs";

// Long answers + tool calls can run past the 10s edge default. Cap at 60s;
// the Anthropic call + a few tool hops fit well inside that.
export const maxDuration = 60;

interface ChatRequestBody {
  id?: string;
  messages: UIMessage[];
}

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!body?.messages || !Array.isArray(body.messages)) {
    return new Response(
      JSON.stringify({ error: "messages[] required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY is not set on the server. Add it to web/.env.local and restart dev.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const result = await runDeanStream({ messages: body.messages });

  // toUIMessageStreamResponse wires text deltas + tool-call parts + metadata
  // into the single SSE stream `useChat` expects. Don't hand-roll this.
  return result.toUIMessageStreamResponse({
    // Surface tool errors to the client as chunks instead of 500s — keeps the
    // UI transcript coherent when a specialist trips.
    onError: (error) =>
      error instanceof Error ? error.message : "Dean lost comms — try again.",
  });
}
