/**
 * Human Delta — semantic search.
 *
 * Used by FOUR of the six specialists:
 *
 *   Archivist    → searchLibrary({ ... })           // no domain filter
 *   Match-Maker  → searchLibrary({ domainAllowlist: [collegescorecard, niche…] })
 *   Bursar       → searchLibrary({ domainAllowlist: [studentaid, .edu…] })   // per school, parallelized
 *   Scout        → searchLibrary({ domainAllowlist: [scholarships.com, …] })
 *
 * HD's flat `search()` returns hits across everything indexed under this API
 * key. Since all four specialists share one knowledge graph, the difference
 * between them is WHICH sources we accept — i.e. domain post-filtering.
 * See `searchLibrary` for the filtering rules.
 */

import "server-only";
import type { SearchResult } from "humandelta";

import { requireClient } from "./client";

/** Raw, unfiltered search. Passes straight through to HD. Useful in debug
 *  tools (`scripts/hd-probe.mts`) and the Archivist console's search
 *  surface, where the student wants to query their whole library. */
export async function search(query: string, topK = 10): Promise<SearchResult[]> {
  return requireClient().search(query, topK);
}

/**
 * Specialist-scoped search.
 *
 * Filters HD's flat result set by `source_url` against a per-specialist
 * domain allowlist so Scout can't quote a Niche college profile and
 * vice versa.
 *
 * Allowlist semantics (suffix match against the URL's hostname):
 *   "niche.com"         matches  https://www.niche.com/colleges/yale/
 *   ".edu"              matches  https://financialaid.columbia.edu/npc
 *   "scholarships.com"  matches  https://www.scholarships.com/abc
 *
 * Over-fetching is intentional: we ask HD for 3x the requested topK since
 * many hits will be filtered out. For the demo/hackathon scale (hundreds
 * of pages) this is cheap. If filtering drops too much and we regularly
 * return under-sized result sets, bump the multiplier.
 *
 * Empty allowlist → no filtering. Used by the Archivist, where the library
 * IS the student's own files — there's no external source to exclude.
 */
export interface LibrarySearchArgs {
  query: string;
  topK?: number;
  /** Domain suffixes. Empty / undefined = no filtering. */
  domainAllowlist?: string[];
}

export async function searchLibrary(
  args: LibrarySearchArgs,
): Promise<SearchResult[]> {
  const { query, topK = 6, domainAllowlist } = args;
  const fetchK = domainAllowlist && domainAllowlist.length > 0 ? topK * 3 : topK;

  const hits = await requireClient().search(query, fetchK);

  if (!domainAllowlist || domainAllowlist.length === 0) {
    return hits.slice(0, topK);
  }

  const filtered = hits.filter((h) => {
    const url = h.source_url ?? "";
    let host = "";
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      // Malformed URL (can happen for document sources, which aren't web
      // pages) — keep them only if the allowlist includes the magic "."
      // suffix. Documents are excluded by default since a specialist
      // filtered for ".edu" almost certainly doesn't want to pull from
      // the student's uploaded resume.
      return domainAllowlist.includes(".");
    }
    return domainAllowlist.some((suffix) => {
      const s = suffix.toLowerCase();
      return (
        host === s ||
        host.endsWith(s.startsWith(".") ? s : `.${s}`) ||
        host.endsWith(s)
      );
    });
  });

  return filtered.slice(0, topK);
}

export type { SearchResult };
