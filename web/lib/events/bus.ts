import type { AgentEvent } from "./types";

/**
 * Server-side emit. Publishes to Supabase Realtime channel `office:events`
 * and also persists to an `events` table for replay/debugging.
 */
export async function emit(_evt: AgentEvent): Promise<void> {
  throw new Error("not implemented");
}
