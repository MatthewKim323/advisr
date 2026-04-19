/**
 * Human Delta — website crawls.
 *
 * This is how we get outside-world knowledge into the library. Point HD at
 * a URL, it crawls `maxPages` pages following links within the same site,
 * chunks + embeds the text, and makes it queryable via `search()`.
 *
 * Who kicks off crawls:
 *   - The seed CLI (`scripts/seed-hd.mts`) — fills the specialist libraries
 *     from the manifests in `./seeds/`.
 *   - The Archivist's web-ingest flow (future) — lets the student say
 *     "index my school's counselor page for me."
 *
 * We deliberately do NOT auto-index the web on every question. That would
 * be too slow, too expensive, and would bias toward whatever's on the first
 * page of a Google result. The libraries are curated.
 */

import "server-only";
import type { IndexJob } from "humandelta";

import { requireClient } from "./client";

export async function crawlSite(
  url: string,
  opts: { maxPages?: number; name?: string } = {},
): Promise<IndexJob> {
  return requireClient().indexes.create(url, opts);
}

export async function listIndexes(): Promise<IndexJob[]> {
  return requireClient().indexes.list();
}

export type { IndexJob };
