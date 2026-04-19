/**
 * Local library search.
 *
 * Scored token overlap between the query and the text body of each
 * curated record, with a small bonus for matched tags. Not an embedding
 * model — at our corpus size (~100 chunks) a keyword scorer retrieves
 * the right passages fast and deterministically.
 *
 * Scoring math:
 *   base  = matched_tokens / query_tokens        (in [0, 1])
 *   tag   = matched_tags / query_tokens × 0.4    (caps tag influence)
 *   score = min(1, base + tag)
 *
 * Empty / too-short queries return [] — we don't randomly pick
 * something; Dean should ask a clarifying question instead.
 *
 * Category & domain filtering:
 *   - `allowedCategories`: restricts to school / aid / scholarship.
 *     Match-Maker passes ["school"], Bursar passes ["aid", "school"],
 *     Scout passes ["scholarship"]. Archivist doesn't use this path.
 *   - `domainAllowlist` (mirroring HD's): URL suffix filter. Used
 *     mainly by Bursar — only return aid records whose `sourceUrl`
 *     matches. We never actually filter schools this way; keeping the
 *     parameter there for shape parity with HD.
 */

import "server-only";
import { SCHOOLS } from "./data/schools";
import { AID } from "./data/aid";
import { SCHOLARSHIPS } from "./data/scholarships";
import type {
  AidRecord,
  LibraryCategory,
  LibraryHit,
  SchoolRecord,
  ScholarshipRecord,
} from "./types";

// ──────────────────────────────────────────────────────────────────────
// One-time: flatten all records into a single chunk list indexed for
// retrieval. Each school fact becomes its own chunk; aid & scholarship
// records collapse to one chunk each.
// ──────────────────────────────────────────────────────────────────────

interface Chunk {
  /** Stable id for LibraryHit.chunk_id. */
  id: string;
  category: LibraryCategory;
  /** Lowercased text tokens we search against. */
  tokens: Set<string>;
  /** Lowercased tag tokens, combined into one set for fast lookup. */
  tags: Set<string>;
  /** What the UI actually renders back. */
  text: string;
  /** Upstream cite-able URL. */
  sourceUrl: string;
  /** Optional slug hint — Bursar uses this to match by school. */
  schoolSlug?: string;
}

/** Cheap token split. Keeps alphanumerics, drops punctuation. Lowercases.
 *  Intentionally keeps single letters and numbers — "uc" and "mit" are
 *  meaningful tokens. */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function tokensOf(text: string, ...extras: string[]): Set<string> {
  const set = new Set<string>();
  for (const t of tokenize(text)) set.add(t);
  for (const e of extras) for (const t of tokenize(e)) set.add(t);
  return set;
}

function schoolToChunks(s: SchoolRecord): Chunk[] {
  return s.facts.map((fact, i): Chunk => ({
    id: `local:school:${s.slug}:${i}`,
    category: "school",
    tokens: tokensOf(fact, s.name, s.context, ...s.tags),
    tags: new Set(s.tags.flatMap((t) => tokenize(t))),
    // Prepend the school name so Dean sees a labeled passage — otherwise
    // short facts can look unmoored from their source.
    text: `${s.name} — ${fact}`,
    sourceUrl: s.sourceUrl,
    schoolSlug: s.slug,
  }));
}

function aidToChunk(a: AidRecord): Chunk {
  return {
    id: `local:aid:${a.slug}`,
    category: "aid",
    tokens: tokensOf(a.text, a.title, ...(a.tags ?? [])),
    tags: new Set((a.tags ?? []).flatMap((t) => tokenize(t))),
    text: `${a.title} — ${a.text}`,
    sourceUrl: a.sourceUrl,
    schoolSlug: a.school,
  };
}

function scholarshipToChunk(s: ScholarshipRecord): Chunk {
  const amt = s.amount >= 100000 ? `${Math.round(s.amount / 1000)}k` : `$${s.amount.toLocaleString()}`;
  const body = `${s.name} — up to ${amt} per year. Deadline: ${s.deadline}. ${s.eligibility}`;
  return {
    id: `local:scholarship:${s.slug}`,
    category: "scholarship",
    tokens: tokensOf(body, ...(s.tags ?? [])),
    tags: new Set((s.tags ?? []).flatMap((t) => tokenize(t))),
    text: body,
    sourceUrl: s.sourceUrl,
  };
}

/** The full corpus — built once at module load. */
const CHUNKS: readonly Chunk[] = [
  ...SCHOOLS.flatMap(schoolToChunks),
  ...AID.map(aidToChunk),
  ...SCHOLARSHIPS.map(scholarshipToChunk),
];

// ──────────────────────────────────────────────────────────────────────
// Scoring
// ──────────────────────────────────────────────────────────────────────

interface ScoreArgs {
  queryTokens: Set<string>;
  chunk: Chunk;
}

function scoreChunk({ queryTokens, chunk }: ScoreArgs): number {
  if (queryTokens.size === 0) return 0;

  let matched = 0;
  let tagMatched = 0;
  for (const t of queryTokens) {
    if (chunk.tokens.has(t)) matched++;
    if (chunk.tags.has(t)) tagMatched++;
  }

  const base = matched / queryTokens.size;
  const tag = Math.min(0.4, (tagMatched / queryTokens.size) * 0.4);
  return Math.min(1, base + tag);
}

// ──────────────────────────────────────────────────────────────────────
// Domain / category filtering
// ──────────────────────────────────────────────────────────────────────

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function matchesDomainAllowlist(sourceUrl: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  const host = hostOf(sourceUrl);
  return allowlist.some((suffix) => {
    const s = suffix.toLowerCase();
    return (
      host === s ||
      host.endsWith(s.startsWith(".") ? s : `.${s}`) ||
      host.endsWith(s)
    );
  });
}

// ──────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────

export interface LocalSearchArgs {
  query: string;
  topK?: number;
  /** If present, only return chunks in these categories. */
  allowedCategories?: LibraryCategory[];
  /** Mirrors HD's domain allowlist — suffix match against sourceUrl host. */
  domainAllowlist?: string[];
  /** If set, prefer chunks whose schoolSlug is in this list. Soft boost
   *  — non-matching chunks can still surface, just at lower priority. */
  preferSchools?: string[];
}

/** Pure, in-memory, deterministic. Safe to call in any server context. */
export function searchLocal(args: LocalSearchArgs): LibraryHit[] {
  const {
    query,
    topK = 6,
    allowedCategories,
    domainAllowlist = [],
    preferSchools = [],
  } = args;

  const qTokens = new Set(tokenize(query));
  if (qTokens.size === 0) return [];

  const preferred = new Set(preferSchools.map((s) => s.toLowerCase()));

  const scored = CHUNKS
    .filter((c) => !allowedCategories || allowedCategories.includes(c.category))
    .filter((c) => matchesDomainAllowlist(c.sourceUrl, domainAllowlist))
    .map((chunk) => {
      const base = scoreChunk({ queryTokens: qTokens, chunk });
      // Boost chunks for schools the caller cares about. 0.15 is enough
      // to re-order near-ties but not to surface irrelevant matches.
      const boost =
        chunk.schoolSlug && preferred.has(chunk.schoolSlug.toLowerCase()) ? 0.15 : 0;
      return { chunk, score: Math.min(1, base + boost) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(
    ({ chunk, score }): LibraryHit => ({
      chunk_id: chunk.id,
      score,
      text: chunk.text,
      source_type: "local",
      source_url: chunk.sourceUrl,
      category: chunk.category,
    }),
  );
}

/** Export the raw counts for health/debug endpoints. */
export function libraryStats() {
  return {
    totalChunks: CHUNKS.length,
    schools: CHUNKS.filter((c) => c.category === "school").length,
    aid: CHUNKS.filter((c) => c.category === "aid").length,
    scholarships: CHUNKS.filter((c) => c.category === "scholarship").length,
  };
}
