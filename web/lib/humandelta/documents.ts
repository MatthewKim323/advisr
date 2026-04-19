/**
 * Human Delta — document uploads (the Archivist's intake chute).
 *
 * When the student drops a PDF, audio file, image, or CSV into the
 * /archivist console, it lands here. HD parses + chunks + embeds it so
 * it's immediately queryable alongside web-crawled content.
 *
 * Why we hit the REST endpoint directly instead of the SDK:
 *   humandelta@0.1.1 npm package exposes `.search()` and `.indexes.*` but
 *   NOT `.documents.*` (Python SDK has them — same underlying REST path).
 *   Rather than block on a JS SDK release, we POST multipart bodies to
 *   `/v1/documents` ourselves. Shape is the same on the server side.
 *
 * When the SDK adds these methods we can drop this file and import from
 * `humandelta` — caller code won't change.
 *
 * Python SDK surface we're mirroring:
 *   hd.documents.upload(file_path, category?, doc_name?)
 *   hd.documents.list(category?)
 *   hd.documents.delete(doc_id)
 */

import "server-only";
import { BASE_URL, authHeaders } from "./client";

export type HdDocument = {
  doc_id: string;
  doc_name: string;
  category?: string | null;
  mime_type?: string | null;
  created_at?: string | null;
  // The API may return more fields (size_bytes, page_count, status, etc.).
  // Pass anything extra through so we don't drop data on the floor.
  [k: string]: unknown;
};

/**
 * Upload a single file to Human Delta.
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
    headers: authHeaders(), // NB: don't set Content-Type — runtime sets the multipart boundary.
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
