/**
 * Shape of one entry in a specialist's seed manifest.
 *
 * Each entry kicks off ONE Human Delta crawl job. Keep `maxPages` tight —
 * HD bills per page and we want quality, not volume. For single profile
 * pages (a Niche college page, a school's /financial-aid landing), set
 * `maxPages: 1`. For directory-style pages where the value IS in the links
 * (e.g. scholarships.com/scholarship-directory), allow more.
 */
export interface SeedEntry {
  /** Starting URL. HD treats this as the crawl root. */
  url: string;
  /** How many pages HD can follow from this root, inclusive of the root
   *  itself. Smaller = cheaper + faster. Larger = more coverage. */
  maxPages: number;
  /** Human-readable label. Shows up in `listIndexes()` so we can tell them
   *  apart. Prefix with specialist id for quick grepping: "match-maker/ucla". */
  name: string;
  /** Free-form note. Not used by HD — purely for the engineer running seeds
   *  so they remember why a URL is in the list. */
  note?: string;
}

/** Which specialists accept seeding. Archivist is intentionally omitted —
 *  its library is whatever the STUDENT uploads, not stuff we crawl. */
export type SeedSpecialist = "match-maker" | "bursar" | "scout";
