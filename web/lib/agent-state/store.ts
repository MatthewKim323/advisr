"use client";

/**
 * Per-agent live status store, driven by the SSE event stream.
 *
 * React consumers use `useAgentStates()` to get a snapshot of every agent's
 * current status. Rendering code that needs per-frame reads (the canvas
 * animation loop) can use `useAgentStatesRef()` to get a ref whose `.current`
 * always holds the latest map, dodging re-renders on every event.
 *
 * State transitions, in order of when they fire during a Dean turn:
 *
 *   Dean starts answering            → dean:    thinking
 *   Dean emits tool_call_started     → X:       working  (from delegation)
 *                                      dean:    thinking → still thinking
 *   Specialist emits progress msg    → X:       working (message updated)
 *   Specialist finishes              → X:       idle (after FINISH_FLASH_MS)
 *   All tools done, Dean wraps up    → dean:    idle (on agent_idle)
 *
 * "Thinking" is a short-lived interstitial the delegation event fires; the
 * specialist almost immediately flips to "working" when its tool actually
 * runs. We don't try to time this precisely — it's a visual beat, not a
 * state we'd gate on.
 */

import { useEffect, useRef, useState } from "react";
import type { CharacterId } from "@/components/office/state-machine";
import { useOfficeEvents } from "@events/client";
import type { AgentEvent } from "@events/types";
import { taskFromInput } from "./task-labels";

export type LiveStatus = "idle" | "thinking" | "working" | "error";

export interface LiveAgentState {
  status: LiveStatus;
  /** Canonical agent-tool name currently running, if any. */
  tool?: string;
  /** Short, human-readable "what are they doing right now." */
  task?: string;
  /** Optional progress message from the tool (e.g. "querying aid for UCLA"). */
  message?: string;
  /** Last transition timestamp (epoch ms). Used to debounce the finish flash. */
  since: number;
}

export type AgentStates = Record<CharacterId, LiveAgentState>;

const ALL_AGENTS: CharacterId[] = [
  "dean",
  "archivist",
  "match-maker",
  "bursar",
  "scout",
  "draft",
  "pacer",
];

/** How long to linger in "working" state after a tool_call_finished before
 *  flipping to idle. Keeps the "done!" flash visible instead of disappearing
 *  the instant the API call returns. */
const FINISH_FLASH_MS = 900;

function initial(): AgentStates {
  const now = Date.now();
  const base: Partial<AgentStates> = {};
  for (const id of ALL_AGENTS) base[id] = { status: "idle", since: now };
  return base as AgentStates;
}

/** Apply one event, return next state. Pure fn — test-friendly. */
export function reduceAgentStates(
  prev: AgentStates,
  evt: AgentEvent,
  now = Date.now(),
): AgentStates {
  switch (evt.type) {
    case "agent_spawned":
      return setStatus(prev, evt.agent, "thinking", now);

    case "agent_idle":
      return setStatus(prev, evt.agent, "idle", now);

    case "agent_blocked":
      return setState(prev, evt.agent, {
        status: "error",
        message: evt.reason?.slice(0, 80),
        since: now,
      });

    case "agent_delegating":
      // The specialist is about to start. Flip them to thinking until the
      // tool_call_started fires and gives us a concrete task.
      return setStatus(prev, evt.to, "thinking", now);

    case "tool_call_started":
      return setState(prev, evt.agent, {
        status: "working",
        tool: evt.tool,
        task: taskFromInput(evt.agent, evt.input) ?? undefined,
        message: undefined,
        since: now,
      });

    case "tool_call_progress":
      // Only update if we're still working — stale progress after finish
      // can race in via SSE reordering.
      if (prev[evt.agent]?.status !== "working") return prev;
      return setState(prev, evt.agent, {
        ...prev[evt.agent],
        message: evt.message?.slice(0, 80),
        since: now,
      });

    case "tool_call_finished":
      // We DON'T flip straight to idle — `setStatus(…,"idle")` would kill
      // the monitor-active visual instantly. We schedule that elsewhere via
      // the finish-flash timer. For now leave `working` but update `since`
      // so consumers can render a "completed" animation.
      return setState(prev, evt.agent, {
        ...prev[evt.agent],
        tool: undefined,
        task: "done",
        message: undefined,
        since: now,
      });

    default:
      return prev;
  }
}

function setStatus(
  prev: AgentStates,
  id: CharacterId,
  status: LiveStatus,
  now: number,
): AgentStates {
  return { ...prev, [id]: { ...prev[id], status, since: now } };
}

function setState(
  prev: AgentStates,
  id: CharacterId,
  next: LiveAgentState,
): AgentStates {
  return { ...prev, [id]: next };
}

// ──────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────

/** React-rendering version — returns a state snapshot that updates every
 *  event. Use this for DOM overlays (tooltips, sidebars). For per-frame
 *  canvas reads, use `useAgentStatesRef()` instead. */
export function useAgentStates(): AgentStates {
  const [states, setStates] = useState<AgentStates>(initial);

  useOfficeEvents((evt) => {
    setStates((prev) => reduceAgentStates(prev, evt));
  });

  // Finish-flash: sweep agents whose status is "working" with task="done"
  // and flip them to idle after FINISH_FLASH_MS. Runs on an interval rather
  // than N setTimeouts so we don't leak timers on bursty tool calls.
  useEffect(() => {
    const t = setInterval(() => {
      setStates((prev) => {
        let changed = false;
        const next = { ...prev };
        const now = Date.now();
        for (const id of ALL_AGENTS) {
          const s = prev[id];
          if (s.status === "working" && s.task === "done" && now - s.since > FINISH_FLASH_MS) {
            next[id] = { status: "idle", since: now };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 200);
    return () => clearInterval(t);
  }, []);

  return states;
}

/** Canvas-loop version — same data, but without triggering a React render
 *  on every event. The returned ref's `.current` is always the latest map,
 *  safe to read inside a requestAnimationFrame tick. */
export function useAgentStatesRef(): React.RefObject<AgentStates> {
  const ref = useRef<AgentStates>(initial());
  const [, force] = useState(0);

  useOfficeEvents((evt) => {
    ref.current = reduceAgentStates(ref.current, evt);
    // Don't setState — that would defeat the point. The canvas reads ref.
    // We DO occasionally trigger one React render (below) so hover overlays
    // hitched to this ref can refresh their labels.
    force((n) => (n + 1) & 0xffff);
  });

  // Same finish-flash sweep as the hook above, but mutates the ref.
  useEffect(() => {
    const t = setInterval(() => {
      let changed = false;
      const now = Date.now();
      const next = { ...ref.current };
      for (const id of ALL_AGENTS) {
        const s = next[id];
        if (s.status === "working" && s.task === "done" && now - s.since > FINISH_FLASH_MS) {
          next[id] = { status: "idle", since: now };
          changed = true;
        }
      }
      if (changed) {
        ref.current = next;
        force((n) => (n + 1) & 0xffff);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  return ref;
}
