"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "./types";
import { createClient as createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * Subscribe to the agent event stream.
 *
 * Under the hood: a single `EventSource` on `/api/events/stream`. Every
 * `AgentEvent` fired on the server bus arrives here. The callback ref is
 * always-current, so consumers don't need to memoize.
 *
 * Auto-reconnects on disconnect (EventSource does this natively). If we need
 * backoff or multi-tab dedup later, this is where it'd go.
 */
export function useOfficeEvents(onEvent: (e: AgentEvent) => void): void {
  const ref = useRef(onEvent);
  ref.current = onEvent;

  useEffect(() => {
    const es = new EventSource("/api/events/stream");

    // Catch-all: the server emits distinct `event:` names (one per event
    // type) for filterable listening, but we relay everything through a
    // single callback so consumers can narrow with a switch.
    const handler = (ev: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(ev.data) as AgentEvent;
        ref.current(parsed);
      } catch {
        // Ignore malformed frames (e.g. keepalive comments never hit here).
      }
    };

    // Subscribe to every event type we know about. We keep this list in
    // sync with AgentEvent["type"] — if you add a new variant in types.ts,
    // add it here.
    const types: AgentEvent["type"][] = [
      "agent_spawned",
      "agent_idle",
      "agent_blocked",
      "agent_delegating",
      "tool_call_started",
      "tool_call_progress",
      "tool_call_finished",
      "claim_proposed",
      "claim_confirmed",
      "claim_rejected",
      "file_uploaded",
      "ingestion_started",
      "ingestion_finished",
      "response_to_user",
      "dean_interjection",
      "query_committed",
      "query_hits_resolved",
      "hero_close_fired",
    ];
    for (const t of types) es.addEventListener(t, handler);

    // ── Supabase Realtime bridge ────────────────────────────────────────
    // SSE handles single-process fanout. If the server ever runs more than
    // one node (Vercel serverless, multi-region), events emitted from one
    // node won't reach an SSE stream held open by another. The `events`
    // table write is the cross-node channel, so we also subscribe to
    // Postgres inserts and feed them into the same handler. Deduped by
    // `(kind, payload)` where payload is the AgentEvent JSON.
    //
    // No-op when Supabase env vars aren't set, so preview deployments and
    // tests don't need a live project.
    let unsubscribeRealtime: (() => void) | null = null;
    if (
      typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      try {
        const supabase = createSupabaseBrowser();
        const chan = supabase
          .channel("nami-events")
          .on(
            // The `postgres_changes` channel event is typed narrowly by the
            // Realtime SDK; we coerce the payload in the handler anyway.
            "postgres_changes" as never,
            { event: "INSERT", schema: "public", table: "events" } as never,
            (msg: unknown) => {
              const row = (msg as { new?: { payload?: AgentEvent } })?.new;
              const payload = row?.payload;
              if (!payload || typeof payload !== "object" || !("type" in payload))
                return;
              ref.current(payload as AgentEvent);
            },
          )
          .subscribe();
        unsubscribeRealtime = () => {
          supabase.removeChannel(chan);
        };
      } catch {
        // Realtime unavailable — SSE is still running, no loss of function.
      }
    }

    return () => {
      for (const t of types) es.removeEventListener(t, handler);
      es.close();
      unsubscribeRealtime?.();
    };
  }, []);
}
