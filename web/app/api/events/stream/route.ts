/**
 * GET /api/events/stream
 *
 * Long-lived Server-Sent Events feed of every `AgentEvent` emitted on the
 * in-memory bus. The pixel office subscribes here so it can flip sprite
 * states (idle / working / walking to handoff) in sync with what Dean and
 * the specialists are actually doing.
 *
 * One SSE connection per browser tab. If we scale to multi-node we swap the
 * bus impl for a pub/sub (Redis / Supabase Realtime) — this route stays the
 * same shape.
 */

import { toAsyncIterable } from "@events/bus";
import type { AgentEvent } from "@events/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function sseFormat(evt: AgentEvent): string {
  return `event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`;
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Keepalive ping every 20s so proxies don't idle-close the connection.
      // Comment lines (`:`) are ignored by EventSource but reset the idle timer.
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          // Controller closed — clear below.
        }
      }, 20_000);

      // Opening event so the client knows the pipe is live.
      controller.enqueue(
        encoder.encode(
          `event: ready\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`,
        ),
      );

      try {
        for await (const evt of toAsyncIterable(req.signal)) {
          controller.enqueue(encoder.encode(sseFormat(evt)));
        }
      } catch (err) {
        // Swallow — AbortError is expected on disconnect; other errors we
        // just log and close gracefully.
        if (!(err instanceof DOMException) || err.name !== "AbortError") {
          // eslint-disable-next-line no-console
          console.error("[events/stream] iterator error:", err);
        }
      } finally {
        clearInterval(ping);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable Nginx buffering for SSE.
      "X-Accel-Buffering": "no",
    },
  });
}
