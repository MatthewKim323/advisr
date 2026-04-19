/**
 * Blended library search.
 *
 * Each specialist's tool calls `searchLibrary()`. This module:
 *   1. Runs a fast, deterministic LOCAL search against the curated corpus
 *      in `web/lib/library/` — school profiles, aid policies, scholarships.
 *   2. Runs a semantic search against Human Delta's knowledge graph.
 *   3. Merges the two lists by interleaving within-source rankings, then
 *      dedupes by `source_url` and returns the top K.
 *
 * Why blend instead of "HD first, local fallback"?
 *
 * HD's crawler has been silently no-op'ing most of our crawls — we've
 * submitted ~60 URLs and only ~3 actually made it into the searchable
 * corpus (see HUMAN_DELTA.md § "Known quirks"). We can't rely on HD
 * alone for the demo, so local is the primary signal. But HD still
 * occasionally returns a useful hit (and the Archivist pulls student
 * uploads from HD), so we keep it live and layered in.
 *
 * The `source_type` field on each hit tells the UI whether to render
 * a "local library" pill or a "HD // web" pill. Dean sees the same
 * shape regardless.
 *
 * Why the SDK search path isn't used:
 *
 * `humandelta@0.1.x`'s `hd.search()` expects the API to return a bare
 * `SearchResult[]`; the production API actually returns `{ results: [...] }`.
 * The SDK silently returns `[]` from the mismatch, so `search()` below
 * hits REST directly and unwraps. Yank this once a fixed SDK ships.
 */

import "server-only";
import type { SearchResult } from "humandelta";

import { BASE_URL, authHeaders } from "./client";
import {
  searchLocal,
  type LibraryCategory,
  type LibraryHit,
} from "@/lib/library";

// ──────────────────────────────────────────────────────────────────────
// Raw HD search (REST, bypasses broken SDK)
// ──────────────────────────────────────────────────────────────────────

/**
 * Low-level HD search. Returns whatever HD indexed — no filtering,
 * no local blending. Used by the Archivist console's raw search surface
 * and by `scripts/hd-probe.mts`. For anything else, prefer `searchLibrary`.
 */
export async function search(query: string, topK = 10): Promise<SearchResult[]> {
  const headers = {
    ...authHeaders(),
    "Content-Type": "application/json",
  };
  const r = await fetch(`${BASE_URL}/v1/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, top_k: topK }),
  });
  if (!r.ok) {
    throw new Error(`HD /v1/search → ${r.status}: ${(await r.text()).slice(0, 200)}`);
  }
  const json = (await r.json()) as SearchResult[] | { results?: SearchResult[] };
  if (Array.isArray(json)) return json;
  return json.results ?? [];
}

// ──────────────────────────────────────────────────────────────────────
// Blended library search
// ──────────────────────────────────────────────────────────────────────

export interface LibrarySearchArgs {
  query: string;
  topK?: number;
  /** Suffix match against the URL hostname. Dropped hits that don't
   *  match. Empty/undefined = no filter. */
  domainAllowlist?: string[];
  /** Restrict LOCAL hits to these categories. Doesn't affect HD (HD
   *  doesn't know our local category taxonomy). */
  categories?: LibraryCategory[];
  /** Soft score boost for local school chunks whose slug matches any
   *  of these — threaded through from the student's profile. */
  preferSchools?: string[];
  /** If true, skip HD entirely and return only local hits. Used by
   *  callers that know HD won't help (e.g. pure-logic probes in tests). */
  localOnly?: boolean;
}

/**
 * The primary retrieval entry point for all library-backed specialists.
 *
 * The return shape is `LibraryHit[]` — a superset of HD's `SearchResult`
 * that adds a `"local"` `source_type` and an optional `category`. Tools
 * downstream treat both provenances uniformly.
 */
export async function searchLibrary(
  args: LibrarySearchArgs,
): Promise<LibraryHit[]> {
  const {
    query,
    topK = 6,
    domainAllowlist,
    categories,
    preferSchools,
    localOnly = false,
  } = args;

  // Local — fast, deterministic, always-on.
  const local = searchLocal({
    query,
    topK: topK * 2, // overfetch a bit; dedupe might drop some
    allowedCategories: categories,
    domainAllowlist,
    preferSchools,
  });

  // HD — best-effort. Network errors get swallowed so an HD outage
  // doesn't tank the whole search path. We log server-side so we can
  // spot persistent issues, but the user still gets local hits.
  let hd: LibraryHit[] = [];
  if (!localOnly) {
    try {
      const fetchK =
        domainAllowlist && domainAllowlist.length > 0 ? topK * 3 : topK;
      const raw = await search(query, fetchK);
      hd = raw.map(hdToLibraryHit);
      if (domainAllowlist && domainAllowlist.length > 0) {
        hd = hd.filter((h) => matchesAllowlist(h.source_url, domainAllowlist));
      }
    } catch (err) {
      console.warn(
        "[searchLibrary] HD unavailable, falling back to local only:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Merge — interleave local & HD so both get representation, dedupe
  // by source_url (keeping the higher-scored version).
  const merged = interleave(local, hd);
  const deduped = dedupeByUrl(merged);

  return deduped.slice(0, topK);
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function hdToLibraryHit(r: SearchResult): LibraryHit {
  return {
    chunk_id: r.chunk_id,
    score: r.score,
    text: r.text,
    source_url: r.source_url,
    source_type: r.source_type,
    page_title: r.page_title ?? null,
    doc_id: r.doc_id ?? null,
  };
}

/** Interleave two lists so the top of both reach Dean early. Local first
 *  by convention — the curated corpus is higher-signal. */
function interleave<T>(a: readonly T[], b: readonly T[]): T[] {
  const out: T[] = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (i < a.length) out.push(a[i]!);
    if (i < b.length) out.push(b[i]!);
  }
  return out;
}

/** Keep the first occurrence of each URL (which, post-interleave, means
 *  the higher-ranked local or HD hit wins). */
function dedupeByUrl(hits: LibraryHit[]): LibraryHit[] {
  const seen = new Set<string>();
  const out: LibraryHit[] = [];
  for (const h of hits) {
    const key = h.source_url || h.chunk_id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

function matchesAllowlist(url: string, allowlist: string[]): boolean {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return allowlist.includes(".");
  }
  return allowlist.some((suffix) => {
    const s = suffix.toLowerCase();
    return (
      host === s ||
      host.endsWith(s.startsWith(".") ? s : `.${s}`) ||
      host.endsWith(s)
    );
  });
}

export type { SearchResult };
export type { LibraryHit };

// ──────────────────────────────────────────────────────────────────────
// searchGraph — dual-scope search for the F1 "Tell me what I said" bar.
// ──────────────────────────────────────────────────────────────────────

import type { QueryHit, Scope, SourceKind } from "@/lib/events/types";

export interface SearchGraphArgs {
  query: string;
  studentId: string;
  scopes?: Scope[]; // default: ["student", "world"]
  topK?: number; // per scope
  paths?: string[]; // restrict student scope to these path prefixes
  grep?: boolean; // literal-string match mode (skips HD)
}

export interface SearchGraphResult {
  query: string;
  hitsByScope: Record<Scope, QueryHit[]>;
  hitsBySourceKind: Record<SourceKind, number>;
  totalHits: number;
  latencyMs: number;
}

/**
 * Dual-scope query used by F1. Returns hits tagged by scope + sourceKind so
 * the source-to-UI binding layer can light specific office surfaces.
 *
 * Student scope → Nami's own Postgres chunks (real data the student uploaded).
 * World scope   → HD + local curated library (college profiles, aid policies,
 *                 scholarships, style guides).
 */
export async function searchGraph(
  args: SearchGraphArgs,
): Promise<SearchGraphResult> {
  const { query, studentId, scopes = ["student", "world"], topK = 12 } = args;
  const started = Date.now();

  const empty = (): QueryHit[] => [];
  const hitsByScope: Record<Scope, QueryHit[]> = {
    student: empty(),
    world: empty(),
  };

  if (scopes.includes("student")) {
    hitsByScope.student = await searchStudentChunks({
      query,
      studentId,
      topK,
      paths: args.paths,
      grep: args.grep,
    });
  }

  if (scopes.includes("world")) {
    const world = await searchLibrary({ query, topK }).catch(() => []);
    hitsByScope.world = world.map((h, i) => ({
      chunkId: h.chunk_id,
      scope: "world" as const,
      sourceKind: inferWorldSourceKind(h),
      text: h.text,
      score: h.score ?? 1 - i / 100,
    }));
  }

  const hitsBySourceKind: Record<SourceKind, number> = {
    transcript: 0,
    essay: 0,
    financial: 0,
    activity: 0,
    "college-profile": 0,
    scholarship: 0,
    "aid-policy": 0,
    "style-guide": 0,
  };
  const allHits = [...hitsByScope.student, ...hitsByScope.world];
  for (const h of allHits) hitsBySourceKind[h.sourceKind]++;

  return {
    query,
    hitsByScope,
    hitsBySourceKind,
    totalHits: allHits.length,
    latencyMs: Date.now() - started,
  };
}

/**
 * Search the student's own uploaded chunks (Postgres). Literal token match
 * first; future work can layer a real FTS/semantic path behind the same
 * signature.
 */
async function searchStudentChunks(args: {
  query: string;
  studentId: string;
  topK: number;
  paths?: string[];
  grep?: boolean;
}): Promise<QueryHit[]> {
  const { hasSupabase, supabaseServiceRoleKey } = await import(
    "@/lib/utils/env"
  );
  if (!hasSupabase()) return [];

  // Prefer the service-role client when available — it bypasses RLS which
  // is important for the /office demo flow where we don't have a logged-in
  // user but still want to read Maria's seeded chunks.
  const serviceKey = supabaseServiceRoleKey();
  let supabase;
  if (serviceKey) {
    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    supabase = await createClient();
  }

  const q = args.query.trim();
  if (!q) return [];

  // Use ILIKE for literal-match. Robust without FTS config.
  const { data, error } = await supabase
    .from("chunks")
    .select(
      "id, source_file_id, source_kind, text, offset_start, offset_end, source_files!inner(student_id, kind, filename)",
    )
    .ilike("text", `%${q}%`)
    .eq("source_files.student_id", args.studentId)
    .limit(args.topK);

  if (error) {
    console.warn("[searchStudentChunks] error:", error.message);
    return [];
  }

  type Row = {
    id: string;
    source_file_id: string;
    source_kind: SourceKind;
    text: string;
    offset_start: number | null;
    offset_end: number | null;
    source_files: { filename: string | null } | null;
  };

  return (data as unknown as Row[]).map((r) => ({
    chunkId: r.id,
    sourceFileId: r.source_file_id,
    sourceFilename: r.source_files?.filename ?? undefined,
    scope: "student" as const,
    sourceKind: r.source_kind,
    text: r.text,
    score: scoreMatch(r.text, q),
    offsetStart: r.offset_start ?? undefined,
    offsetEnd: r.offset_end ?? undefined,
  }));
}

function scoreMatch(text: string, q: string): number {
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  let n = 0;
  let idx = 0;
  while ((idx = lower.indexOf(ql, idx)) !== -1) {
    n++;
    idx += ql.length;
  }
  return Math.min(1, n / 3);
}

function inferWorldSourceKind(h: LibraryHit): SourceKind {
  // Cheap URL-based inference; refine as the taxonomy stabilizes.
  const url = (h.source_url ?? "").toLowerCase();
  if (url.includes("scholarship") || url.includes("makergirl")) return "scholarship";
  if (url.includes("fafsa") || url.includes("pell") || url.includes("finaid")) return "aid-policy";
  if (url.includes("collegevine") || url.includes("style") || url.includes("essay-guide")) return "style-guide";
  if (url.includes("admission") || url.includes(".edu")) return "college-profile";
  return "college-profile";
}
