/**
 * Thin wrapper around browser-use (cloud mode). Every call goes through here
 * so we can (a) emit `tool_call_started`/`tool_call_finished` events on every
 * step, (b) route through the demo-mode cache during recording, (c) swap
 * providers later without rewriting every agent.
 */

export interface BrowseOptions {
  task: string;                    // Natural-language task
  site?: string;                   // Optional starting URL
  agent: string;                   // For event attribution
  maxSteps?: number;
  screenshot?: boolean;
}

export interface BrowseResult {
  ok: boolean;
  finalUrl?: string;
  output: unknown;
  screenshots?: string[];          // Urls into Supabase storage
  durationMs: number;
}

export async function browse(_opts: BrowseOptions): Promise<BrowseResult> {
  throw new Error("not implemented");
}
