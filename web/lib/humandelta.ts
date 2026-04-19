/**
 * humandelta.ts — server-side Human Delta SDK wrapper.
 *
 * The API key (`hd_live_…`) MUST stay on the server. This module is only
 * importable from API routes / server components. Every helper guards on
 * `HUMANDELTA_API_KEY` being present and returns a typed `HdError` when it
 * isn't, so the UI can render a friendly "not configured" state instead of
 * a 500.
 *
 * Why a thin wrapper instead of raw `HumanDelta` everywhere:
 *   - Centralises the env-var lookup + the `hd_live_` format check.
 *   - Adds `documents.*` which the npm SDK v0.1.1 doesn't expose yet
 *     (Python SDK does — same REST endpoint `/v1/documents`).
 *   - Normalises errors into `{ error }` JSON shapes for the UI.
 *
 * Reference: https://dev.humandelta.ai/docs/for-agents
 */

import "server-only";
import { HumanDelta, type SearchResult, type IndexJob } from "humandelta";

const BASE_URL = process.env.HUMANDELTA_BASE_URL ?? "https://api.humandelta.ai";

let _client: HumanDelta | null = null;

/** Lazy singleton. Returns null if the key is missing or malformed. */
export function getClient(): HumanDelta | null {
  if (_client) return _client;
  const key = process.env.HUMANDELTA_API_KEY;
  if (!key || !key.startsWith("hd_live_")) return null;
  _client = new HumanDelta({ apiKey: key, baseUrl: BASE_URL });
  return _client;
}

export class HdNotConfigured extends Error {
  constructor() {
    super("HUMANDELTA_API_KEY not set (or doesn't start with hd_live_)");
  }
}

function requireClient(): HumanDelta {
  const c = getClient();
  if (!c) throw new HdNotConfigured();
  return c;
}

function authHeaders(): Record<string, string> {
  const key = process.env.HUMANDELTA_API_KEY;
  if (!key || !key.startsWith("hd_live_")) throw new HdNotConfigured();
  return { Authorization: `Bearer ${key}` };
}

/* ──────────────────────────────────────────────────────────────
   Search — thin passthrough to the SDK.
   ────────────────────────────────────────────────────────────── */

export async function search(query: string, topK = 10): Promise<SearchResult[]> {
  return requireClient().search(query, topK);
}

/* ──────────────────────────────────────────────────────────────
   Indexes — website crawls. e.g. point Archivist at a college's
   admissions site to ingest all their pages into the library.
   ────────────────────────────────────────────────────────────── */

export async function crawlSite(
  url: string,
  opts: { maxPages?: number; name?: string } = {},
): Promise<IndexJob> {
  return requireClient().indexes.create(url, opts);
}

export async function listIndexes(): Promise<IndexJob[]> {
  return requireClient().indexes.list();
}

/* ──────────────────────────────────────────────────────────────
   Documents — PDF / audio / image / CSV uploads.
   The JS SDK v0.1.1 doesn't expose these yet, so we hit the REST
   endpoint directly. Python SDK surface:
     hd.documents.upload(file_path, category?, doc_name?)
     hd.documents.list(category?)
     hd.documents.delete(doc_id)
   ────────────────────────────────────────────────────────────── */

export type HdDocument = {
  doc_id: string;
  doc_name: string;
  category?: string | null;
  mime_type?: string | null;
  created_at?: string | null;
  // The API may return more fields (size_bytes, page_count, status, etc.).
  // We accept anything extra and pass it through.
  [k: string]: unknown;
};

/** Upload a single file to Human Delta documents.
 *
 * Accepts a Web API `File` (which is what Next.js gives you from
 * `formData()`), converts it to a multipart body keyed `file`, and POSTs
 * it to `/v1/documents`. Category + name are optional form fields.
 */
export async function uploadDocument(args: {
  file: File;
  category?: string;
  docName?: string;
}): Promise<HdDocument> {
  const fd = new FormData();
  fd.append("file", args.file, args.file.name);
  if (args.category) fd.append("category", args.category);
  if (args.docName) fd.append("doc_name", args.docName);

  const r = await fetch(`${BASE_URL}/v1/documents`, {
    method: "POST",
    headers: authHeaders(), // NB: do NOT set Content-Type — the runtime sets the boundary
    body: fd,
  });
  if (!r.ok) {
    throw new Error(`uploadDocument → ${r.status}: ${await r.text()}`);
  }
  return (await r.json()) as HdDocument;
}

export async function listDocuments(category?: string): Promise<HdDocument[]> {
  const u = new URL(`${BASE_URL}/v1/documents`);
  if (category) u.searchParams.set("category", category);
  const r = await fetch(u, { headers: authHeaders() });
  if (!r.ok) throw new Error(`listDocuments → ${r.status}: ${await r.text()}`);
  const raw = (await r.json()) as unknown;
  return Array.isArray(raw) ? (raw as HdDocument[]) : [];
}

export async function deleteDocument(docId: string): Promise<void> {
  const r = await fetch(`${BASE_URL}/v1/documents/${encodeURIComponent(docId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error(`deleteDocument → ${r.status}: ${await r.text()}`);
}

export type { SearchResult, IndexJob };
