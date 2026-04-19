/**
 * Specialist catalog.
 *
 * The source of truth for: who each agent is, what they do, when Dean should
 * call them, and what their "voice" sounds like when they roleplay a response
 * back through the tool-call placeholder path.
 *
 * Dean's tool definitions (see ./tools.ts) read from this list to build their
 * `description` fields — so if you tweak a role here, Dean's routing logic
 * updates on the next request with zero other changes.
 *
 * The real `run<Agent>()` functions in ./dean.ts / ./bursar.ts / … are still
 * stubbed. Until they're live, the corresponding tool returns a narration-only
 * "placeholder" response in that specialist's voice. Demo still reads
 * realistically; the agent just isn't doing the real work yet.
 */

import type { CharacterId } from "@/components/office/state-machine";
import type { LibraryCategory } from "@/lib/library";

export interface Specialist {
  id: Exclude<CharacterId, "dean">;
  /** Shown in UI delegation chips. */
  label: string;
  /** Pitch — "The Essay Coach." Used in the tool description Dean sees. */
  tagline: string;
  /** A one-paragraph description of what the specialist actually does.
   *  This is prepended to the tool description so Claude knows when to pick
   *  them. Keep it task-oriented. */
  brief: string;
  /** Example prompts the student might send that should route here. Helps
   *  Claude's routing accuracy without us having to hand-craft few-shot. */
  invocationCues: string[];
  /** Voice — used by the placeholder tool impl while the real agent is stub.
   *  Short, in-character, signs with the agent's name. */
  voiceHint: string;
  /** How this specialist does its work at runtime:
   *   - "library"     → runs hd.search() filtered by its domainAllowlist.
   *   - "student"     → runs hd.search() unfiltered (Archivist — all student files).
   *   - "logic"       → pure computation, no LLM, no retrieval (Pacer).
   *   - "synth"       → takes context + runs its own dedicated LLM pass (Draft).
   *   - "placeholder" → returns a roleplay response until we wire the real tool. */
  mode: "library" | "student" | "logic" | "synth" | "placeholder";
  /** For `mode: "library"`, restrict hits to these domain suffixes. Anything
   *  outside this list is dropped before returning to Dean. Empty list means
   *  "accept any source" — only useful for the student-library case. */
  domainAllowlist?: string[];
  /** For `mode: "library"`, restrict local-corpus hits to these categories.
   *  Ignored by HD (HD doesn't know our taxonomy). Match-Maker wants schools;
   *  Bursar wants aid + school context; Scout wants scholarships only. */
  libraryCategories?: LibraryCategory[];
  /** Human-readable hint shown in the UI + used in the "seed these URLs"
   *  docs. Nothing in the runtime actually reads this — it's a reminder of
   *  what the specialist EXPECTS to find in the library. */
  seedHint?: string;
}

export const SPECIALISTS: Record<Specialist["id"], Specialist> = {
  archivist: {
    id: "archivist",
    label: "Archivist",
    tagline: "The Memory — owns the student's records.",
    brief:
      "Searches the student's personal knowledge library (transcripts, essays, " +
      "activity lists, parents' W-2s, counselor notes — anything they've dropped " +
      "into the intake chute). Returns ranked passages with source filenames. " +
      "Call this before answering any question that could be grounded in the " +
      "student's own history.",
    invocationCues: [
      "what's my GPA",
      "did I write about my grandmother yet",
      "what did my counselor say about UC essays",
      "show me my activity list",
    ],
    voiceHint:
      "Speaks in clipped, precise sentences. Refers to files by callsign, not " +
      "filename. Signs off with file-pulled counts.",
    mode: "student",
  },
  "match-maker": {
    id: "match-maker",
    label: "Match-Maker",
    tagline: "The School Strategist.",
    brief:
      "Builds a tiered safety/target/reach school list personalized to the " +
      "student's profile (GPA, test scores, demographics, financial need, " +
      "intended major, geographic preferences). Surfaces hidden-gem schools " +
      "where the student has a demonstrable advantage. Pulls admit rates, " +
      "grad rates, CDS data, and student-voice reviews from its library.",
    invocationCues: [
      "what schools should I apply to",
      "am I a reach for Vandy",
      "more safeties",
      "hidden gems for pre-med",
    ],
    voiceHint:
      "Analytical, data-first. Names schools with their admit rate in parens.",
    mode: "library",
    libraryCategories: ["school"],
    domainAllowlist: [
      "collegescorecard.ed.gov",
      "niche.com",
      "ipeds.ed.gov",
      "commondataset.org",
      // Wikipedia indexes cleanly (server-rendered HTML, dense prose).
      // Niche pages are JS-heavy and often only cough up boilerplate when
      // crawled — Wikipedia articles are our primary source for admit rates,
      // demographics, selectivity, and general school reputation.
      "wikipedia.org",
    ],
    seedHint:
      "Index Wikipedia articles for each target school (dense, reliable " +
      "coverage), plus Niche profiles where they crawl cleanly. College " +
      "Scorecard institution pages for authoritative admit/outcome data.",
  },
  bursar: {
    id: "bursar",
    label: "Bursar",
    tagline: "The Financial Aid Advisor.",
    brief:
      "Estimates true out-of-pocket cost at each school after aid. Queries " +
      "the pre-indexed aid library (NPC pages, CDS PDFs, cost-of-attendance " +
      "notes) for the student's target schools. Distinguishes grants from " +
      "disguised loans. Compares offers side-by-side.",
    invocationCues: [
      "can I afford this",
      "what will Columbia actually cost",
      "compare these aid offers",
      "why is my EFC so high",
    ],
    voiceHint:
      "Direct about money. Numbers upfront. No euphemisms for debt.",
    mode: "library",
    // Bursar sees both aid records AND school records — school facts
    // often contain financial-aid policy prose (need-blind status,
    // average grant amounts) that's useful context for cost questions.
    libraryCategories: ["aid", "school"],
    domainAllowlist: [
      "studentaid.gov",
      "collegescorecard.ed.gov",
      "commondataset.org",
      "wikipedia.org",
      // School financial aid subdomains — accept any .edu path for now.
      ".edu",
    ],
    seedHint:
      "Index each school's /financial-aid and /net-price-calculator paths. " +
      "Studentaid.gov for FAFSA / federal aid context. CDS PDFs for aid " +
      "breakdown percentages.",
  },
  scout: {
    id: "scout",
    label: "Scout",
    tagline: "The Scholarship Hunter.",
    brief:
      "Finds scholarships the student is actually eligible for (filters by " +
      "demographics, intended major, activities, financial need). Deadlines " +
      "included. Prioritizes high-value, low-competition awards. Queries " +
      "the pre-indexed scholarship directory library.",
    invocationCues: [
      "what scholarships can I get",
      "find me free money",
      "any awards for first-gen",
    ],
    voiceHint:
      "Treasure-hunter energy. Lists awards by $ value, then deadline.",
    mode: "library",
    libraryCategories: ["scholarship"],
    domainAllowlist: [
      "scholarships.com",
      "goingmerry.com",
      "fastweb.com",
      "careeronestop.org",
      // Scholarship sponsors themselves — we curate records that link
      // back to the sponsor's own page (thegatesscholarship.org,
      // questbridge.org, jkcf.org). Widen the allowlist to match.
      "thegatesscholarship.org",
      "coca-colascholarsfoundation.org",
      "jkcf.org",
      "questbridge.org",
      "ronbrown.org",
      "goldwaterscholarship.gov",
      "swe.org",
      "davidsongifted.org",
      "possefoundation.org",
      "dellscholars.org",
      "horatioalger.org",
      "niche.com",
      "hsf.net",
      "uncf.org",
      "apiascholars.org",
    ],
    seedHint:
      "Index scholarship directory listing pages (not single-award pages). " +
      "Skip Bold.org — it's auth-walled and won't crawl cleanly.",
  },
  draft: {
    id: "draft",
    label: "Draft",
    tagline: "The Essay Coach.",
    brief:
      "Reads and critiques college essays. Not 'add more detail' — real " +
      "structural feedback: thesis clarity, show-don't-tell, cliché detection " +
      "(grandparent stories, mission trips, game-winning shots), voice " +
      "consistency. Catches redundancy across multiple essays.",
    invocationCues: [
      "review my Common App essay",
      "is this opening too cliché",
      "help me with UC PIQ #2",
    ],
    voiceHint:
      "Workshop-teacher. Points at the weak line, doesn't coddle.",
    mode: "synth",
  },
  pacer: {
    id: "pacer",
    label: "Pacer",
    tagline: "The Deadline Manager.",
    brief:
      "Knows what the student should be doing right now. Tracks application " +
      "deadlines, FAFSA/CSS, scholarship due dates, school-specific " +
      "supplements — all computed relative to today and the student's grad " +
      "year. Proactively surfaces critical items.",
    invocationCues: [
      "what's due soon",
      "am I behind",
      "when is UC due",
      "what should I be doing this week",
    ],
    voiceHint:
      "Clock-watcher. Urgent but not panicky. Lists by days-remaining.",
    mode: "logic",
  },
};

/** Compact list of specialist IDs, excluding Dean. */
export const SPECIALIST_IDS: Array<Specialist["id"]> =
  Object.keys(SPECIALISTS) as Array<Specialist["id"]>;
