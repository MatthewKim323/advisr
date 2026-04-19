/**
 * Types for the local library.
 *
 * The local library is our answer to "HD's crawler is unreliable" — a
 * small, hand-curated corpus that Match-Maker / Bursar / Scout query
 * FIRST, falling back to HD if nothing matches. The records are
 * intentionally shaped like Human Delta's `SearchResult` so callers
 * (dean's tools) don't care where a hit came from.
 *
 * One flat `LibraryHit` shape → three specialists get their slice via
 * `category` + domain allowlist filtering.
 */

/** The unified shape EVERY specialist passage comes back in — local OR
 *  Human Delta. Deliberately a superset of HD's `SearchResult` so Dean's
 *  tool layer doesn't have to branch on provenance.
 *
 *  `source_type` has three values:
 *    "web"      → HD-indexed website chunk
 *    "document" → HD-indexed student upload
 *    "local"    → hand-curated record from `web/lib/library/data/*`
 *
 *  Callers SHOULD NOT compare scores across `source_type`s — local uses
 *  token overlap, HD uses embeddings, the scales don't line up. We merge
 *  by interleaving within-source rankings, not by raw score. */
export interface LibraryHit {
  /** Stable id. For local records, `local:<category>:<slug>`. For HD,
   *  HD's native `chunk_id`. */
  chunk_id: string;
  /** Relevance score in [0, 1]. Local = keyword-overlap; HD = embeddings. */
  score: number;
  /** The actual passage a specialist returns to Dean. Should be short
   *  (~100-300 chars) and self-contained — one paragraph, not an
   *  entire article. */
  text: string;
  /** Canonical source URL. For local records this points back to where
   *  the fact was curated from (Wikipedia, studentaid.gov, etc.) so
   *  Dean can still cite it to the student. */
  source_url: string;
  /** "web" | "document" | "local". */
  source_type: "web" | "document" | "local";
  /** Optional page title. HD populates this for most web hits; local
   *  records leave it empty. */
  page_title?: string | null;
  /** Optional doc id for HD document hits (student uploads). */
  doc_id?: string | null;
  /** Optional: the record's category ("school" | "aid" | "scholarship").
   *  Used for filtering inside `searchLocal` and for the UI pill in chat. */
  category?: LibraryCategory;
}

export type LibraryCategory = "school" | "aid" | "scholarship";

// ──────────────────────────────────────────────────────────────────────
// Source records
// ──────────────────────────────────────────────────────────────────────

/** A college/university. Match-Maker's bread and butter.
 *
 *  NOTE: `facts` is an array of short, self-contained paragraphs. Each
 *  one becomes its own searchable "chunk" — so the same school can match
 *  different queries via different facts (admit rate vs financial aid vs
 *  student life). */
export interface SchoolRecord {
  slug: string;
  name: string;
  /** e.g. "private research university, Cambridge MA" */
  context: string;
  /** Comma-separated keyword tags for retrieval ("Ivy League", "need-blind",
   *  "no loans", "R1", "top LAC"). */
  tags: string[];
  /** Upstream canonical URL the facts were sourced from. */
  sourceUrl: string;
  /** One fact per passage. Each gets chunked and indexed separately. */
  facts: string[];
}

/** A financial aid policy or concept (school-specific or federal). */
export interface AidRecord {
  slug: string;
  /** "Harvard — tuition-free under $85k" or "FAFSA overview" */
  title: string;
  /** Optional school slug this applies to; absent = universal/federal. */
  school?: string;
  tags: string[];
  sourceUrl: string;
  /** One paragraph. Aid pages tend to be shorter than school records. */
  text: string;
}

/** A scholarship. Scout's territory. */
export interface ScholarshipRecord {
  slug: string;
  name: string;
  /** Typical amount in USD — a single number keeps search ranking simple.
   *  Use the upper bound if a range. */
  amount: number;
  /** ISO-ish deadline description ("rolling", "2025-11-01", "spring",
   *  "mid-January"). Parsed loosely — we just display it back. */
  deadline: string;
  /** Who can apply. First sentence should be the hook. */
  eligibility: string;
  tags: string[];
  sourceUrl: string;
}
