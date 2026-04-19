/**
 * Demo-mode cache. When DEMO_MODE=true, every browse() call is served from
 * disk in <2s. The live browser window still renders (visual integrity) —
 * but the underlying response was recorded in rehearsal.
 *
 * Budget from plan: 1–2h to build, pays for itself 100x in recording confidence.
 *
 * Recording: `npm run cache:record` — walks the scripted demo path once
 * with live browser-use, hashes (task, site, student_id), writes result to
 * web/lib/browser/.cache/<hash>.json.
 */

import type { BrowseOptions, BrowseResult } from "./client";

export function cacheKey(opts: BrowseOptions, studentId: string): string {
  // stable key: trim + lowercase task, include site + student
  const normalized = `${opts.agent}|${opts.site ?? ""}|${studentId}|${opts.task.trim().toLowerCase()}`;
  return normalized;
}

export async function readCached(_key: string): Promise<BrowseResult | null> {
  throw new Error("not implemented");
}

export async function writeCached(_key: string, _result: BrowseResult): Promise<void> {
  throw new Error("not implemented");
}
