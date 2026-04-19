/**
 * Local library barrel.
 *
 * The local library is our fallback corpus for when HD's crawler isn't
 * cooperating. It's consumed by `web/lib/humandelta/search.ts::searchLibrary`
 * which blends local + HD hits into a single result list before handing
 * back to Dean.
 *
 * Server-only — the curated data is fine to ship to the browser, but
 * `searchLocal` lives on the server to match `searchLibrary`'s contract.
 */

export { searchLocal, libraryStats } from "./search";
export type {
  LibraryHit,
  LibraryCategory,
  SchoolRecord,
  AidRecord,
  ScholarshipRecord,
} from "./types";
export { SCHOOLS } from "./data/schools";
export { AID } from "./data/aid";
export { SCHOLARSHIPS } from "./data/scholarships";
