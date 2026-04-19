"use client";

import type { AgentEvent } from "./types";

/**
 * Client-side subscribe. Used by the office canvas + chat panel.
 * Wraps @supabase/supabase-js Realtime channel behind a plain onEvent API.
 */
export function useOfficeEvents(_onEvent: (e: AgentEvent) => void): void {
  // TODO: subscribe to Supabase Realtime channel "office:events" and call onEvent.
}
