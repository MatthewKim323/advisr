"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "./types";

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
    ];
    for (const t of types) es.addEventListener(t, handler);

    return () => {
      for (const t of types) es.removeEventListener(t, handler);
      es.close();
    };
  }, []);
}
