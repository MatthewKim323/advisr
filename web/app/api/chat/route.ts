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
import { DEMO_STUDENT_ID } from "@/lib/utils/env";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { UIMessage } from "ai";

/**
 * Deployment cost-guard.
 *
 * Dean is an expensive path — every turn hits Claude Sonnet 4.5 and
 * potentially runs several specialist tool calls. On the public Vercel
 * deployment we want the UI to *look* alive without actually burning
 * the Anthropic budget (hackathon demos get scraped hard the moment a
 * URL lands on twitter).
 *
 * Detection:
 *   - `VERCEL` env var is set automatically on all Vercel runtimes.
 *   - `NAMI_CHAT_STUB=1` is an explicit manual override for staging /
 *     local simulation of the stub path.
 *
 * Local dev has neither set, so the real Anthropic call runs like
 * normal. Demo recordings, `npm run dev`, and e2e tests are unaffected.
 */
const STUB_ENABLED =
  process.env.VERCEL === "1" || process.env.NAMI_CHAT_STUB === "1";

const STUB_MESSAGE = [
  "Hey — Dean here, speaking from the surface.",
  "",
  "The pixel office is a live demo, so I'm parked in port on the public deployment to keep API costs from drowning the project. The full crew (match-maker, bursar, scout, draft, scout, timekeeper) only runs when the author runs Nami locally.",
  "",
  "If you want to see the Tsunami actually work, clone the repo and follow the README — `git clone github.com/MatthewKim323/nami && npm run dev`.",
  "",
  "Appreciate you diving in. ⚓",
].join("\n");

// The humandelta SDK + our tools use Node-only APIs (fetch with FormData,
// multipart boundary handling). Force Node runtime.
export const runtime = "nodejs";

// Long answers + tool calls can run past the 10s edge default. Cap at 60s;
// the Anthropic call + a few tool hops fit well inside that.
export const maxDuration = 60;

interface ChatRequestBody {
  id?: string;
  messages: UIMessage[];
  /** Optional — defaults to the demo student for unauthed sessions. */
  studentId?: string;
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

  // Production cost-guard: stream a canned reply instead of calling
  // Anthropic. Writes text-start → text-delta* → text-end in AI-SDK's
  // UI-message-stream format so <ChatPanel/> renders it identically to
  // a real Dean response, typewriter effect and all.
  if (STUB_ENABLED) {
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const id = "stub-" + Date.now().toString(36);
        writer.write({ type: "text-start", id });
        // Emit in small word-level chunks with a tiny delay so the UI
        // gets its usual streaming shimmer rather than dumping the
        // whole message in one frame.
        for (const chunk of STUB_MESSAGE.split(/(\s+)/)) {
          if (chunk.length === 0) continue;
          writer.write({ type: "text-delta", id, delta: chunk });
          await new Promise((r) => setTimeout(r, 18));
        }
        writer.write({ type: "text-end", id });
      },
    });
    return createUIMessageStreamResponse({ stream });
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

  const result = await runDeanStream({
    messages: body.messages,
    studentId: body.studentId ?? DEMO_STUDENT_ID,
  });

  // toUIMessageStreamResponse wires text deltas + tool-call parts + metadata
  // into the single SSE stream `useChat` expects. Don't hand-roll this.
  return result.toUIMessageStreamResponse({
    // Surface tool errors to the client as chunks instead of 500s — keeps the
    // UI transcript coherent when a specialist trips.
    onError: (error) =>
      error instanceof Error ? error.message : "Dean lost comms — try again.",
  });
}
