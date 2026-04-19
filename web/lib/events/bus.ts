/**
 * Event bus — dual path.
 *
 *   1. In-memory Set<callback> for per-process SSE fanout (fast, local).
 *   2. Optional Supabase Realtime via `events` table insert (durable,
 *      cross-process, survives hot reload).
 *
 * `emit()` is fire-and-forget. The DB write happens best-effort in the
 * background and never blocks the caller. If Supabase isn't configured,
 * it's an in-memory-only bus.
 *
 * Consumer UI stays on SSE (`/api/events/stream`) in dev for immediacy.
 * Production can swap to Realtime by reading from the `events` table.
 */

import type { AgentEvent } from "./types";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { hasSupabase, supabaseServiceRoleKey } from "@/lib/utils/env";

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

async function writeDb(evt: AgentEvent, studentId?: string) {
  if (!hasSupabase()) return;
  try {
    // Prefer service-role so writes succeed from unauthed contexts (API
    // routes called during demo-bypass, cron jobs, seed scripts, etc.).
    const serviceKey = supabaseServiceRoleKey();
    let supabase;
    if (serviceKey) {
      const { createClient } = await import("@supabase/supabase-js");
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
    } else {
      supabase = await createSupabaseServer();
    }
    // One event row per emit. Cheap; <1KB typical.
    await supabase.from("events").insert({
      student_id: studentId ?? null,
      kind: evt.type,
      payload: evt as unknown as Record<string, unknown>,
    });
  } catch (err) {
    // Do not take the turn down on a DB write blip.
    console.error("[event-bus] DB write failed:", err);
  }
}

/** Fire-and-forget. */
export function emit(evt: AgentEvent, studentId?: string): void {
  const { subscribers } = getState();
  for (const sub of subscribers) {
    try {
      sub(evt);
    } catch (err) {
      console.error("[event-bus] subscriber threw:", err);
    }
  }
  // Background DB write; do not await.
  void writeDb(evt, studentId);
}

export function subscribe(fn: Subscriber): () => void {
  const { subscribers } = getState();
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

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
          if (closed)
            return Promise.resolve({
              value: undefined as unknown as AgentEvent,
              done: true,
            });
          if (queue.length > 0) {
            return Promise.resolve({ value: queue.shift()!, done: false });
          }
          return new Promise((r) => {
            resolve = r;
          });
        },
        return(): Promise<IteratorResult<AgentEvent>> {
          close();
          return Promise.resolve({
            value: undefined as unknown as AgentEvent,
            done: true,
          });
        },
      };
    },
  };
}
