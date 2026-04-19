/**
 * Human Delta — barrel export.
 *
 * Everywhere else in the app imports from `@/lib/humandelta` and gets the
 * whole surface area. Split files live next to this one for readability:
 *
 *   client.ts      — singleton, auth, `HdNotConfigured`
 *   search.ts      — `search()`, `searchLibrary()`  (used by 4 specialists)
 *   indexes.ts     — `crawlSite()`, `listIndexes()` (used by the seed CLI)
 *   documents.ts   — file uploads (used by the Archivist intake flow)
 *   seeds/         — per-specialist URL manifests (what we pre-index)
 *   README.md      — integration docs, read me first
 *
 * If you're new: start with `README.md`. If you want to trace a specialist
 * call into HD, start with `search.ts` (`searchLibrary`).
 */

import "server-only";

export { BASE_URL, getClient, requireClient, HdNotConfigured } from "./client";
export { search, searchLibrary, type LibrarySearchArgs, type SearchResult } from "./search";
export { crawlSite, listIndexes, type IndexJob } from "./indexes";
export { uploadDocument, listDocuments, deleteDocument, type HdDocument } from "./documents";
