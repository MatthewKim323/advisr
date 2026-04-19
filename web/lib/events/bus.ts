/**
 * In-memory event bus.
 *
 * Every agent tool-call emits one of these. Consumers:
 *   1. Chat UI — renders "DEAN → ARCHIVIST // SEARCHING RECORDS…" lines
 *      inline with the conversation.
 *   2. Pixel office (future) — flips agent sprites between `working` / `idle`
 *      so the submarine actually reacts to the conversation.
 *
 * Why in-memory (not Supabase Realtime yet):
 *   For the hackathon we run one Next.js process; a Set<callback> fanout is
 *   all we need. When we go multi-node we swap the emit() impl for Redis or
 *   Supabase without touching any call-sites. Same contract.
 *
 * Survives HMR: the Set lives on `globalThis` so route handlers + SSE
 * subscribers re-bind to the same instance across dev reloads.
 */

import type { AgentEvent } from "./types";

type Subscriber = (evt: AgentEvent) => void;

const GLOBAL_KEY = "__nami_event_bus__" as const;

type BusState = {
  subscribers: Set<Subscriber>;
};

function getState(): BusState {
  const g = globalThis as unknown as Record<string, unknown>;
  let s = g[GLOBAL_KEY] as BusState | undefined;
  if (!s) {
    s = { subscribers: new Set() };
    g[GLOBAL_KEY] = s;
  }
  return s;
}

/** Fire-and-forget. Swallows subscriber errors so one bad listener can't
 *  take the turn down. */
export function emit(evt: AgentEvent): void {
  const { subscribers } = getState();
  for (const sub of subscribers) {
    try {
      sub(evt);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[event-bus] subscriber threw:", err);
    }
  }
}

/** Subscribe. Returns an unsubscribe thunk — call it on connection close. */
export function subscribe(fn: Subscriber): () => void {
  const { subscribers } = getState();
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/** Convenience: one event subscription drained into an async iterator. Used
 *  by the SSE endpoint — `for await (const evt of toAsyncIterable()) …`. */
export function toAsyncIterable(
  signal?: AbortSignal,
): AsyncIterable<AgentEvent> {
  const queue: AgentEvent[] = [];
  let resolve: ((v: IteratorResult<AgentEvent>) => void) | null = null;
  let closed = false;

  const unsub = subscribe((evt) => {
    if (closed) return;
    if (resolve) {
      const r = resolve;
      resolve = null;
      r({ value: evt, done: false });
    } else {
      queue.push(evt);
    }
  });

  const close = () => {
    if (closed) return;
    closed = true;
    unsub();
    if (resolve) {
      const r = resolve;
      resolve = null;
      r({ value: undefined as unknown as AgentEvent, done: true });
    }
  };

  signal?.addEventListener("abort", close, { once: true });

  return {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<AgentEvent>> {
          if (closed) return Promise.resolve({ value: undefined as unknown as AgentEvent, done: true });
          if (queue.length > 0) {
            return Promise.resolve({ value: queue.shift()!, done: false });
          }
          return new Promise((r) => {
            resolve = r;
          });
        },
        return(): Promise<IteratorResult<AgentEvent>> {
          close();
          return Promise.resolve({ value: undefined as unknown as AgentEvent, done: true });
        },
      };
    },
  };
}
