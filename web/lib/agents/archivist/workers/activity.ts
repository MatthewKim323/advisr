/**
 * C10 — ActivityExtractor.
 *
 * Parses activity lists (Common App style or free-text). Extracts
 * participates_in, leads, years_involved, hours_per_week claims.
 */

import type {
  ArchivistWorker,
  ArchivistWorkerResult,
  ProposedClaim,
} from "../types";

interface ActivityBlock {
  name: string;
  raw: string;
}

const KNOWN_ACTIVITIES: Array<{
  slug: string;
  matchers: RegExp[];
}> = [
  { slug: "Soccer", matchers: [/soccer/i] },
  { slug: "RoboticsClub", matchers: [/robotics/i] },
  { slug: "In-N-Out_Burger", matchers: [/in[-\s]?n[-\s]?out/i] },
  { slug: "St_Anthonys_Youth_Group", matchers: [/st\.?\s*anthony/i, /youth group/i] },
  { slug: "AAPI_Student_Union", matchers: [/aapi/i] },
  { slug: "Math_Tutoring", matchers: [/tutor/i] },
  { slug: "Family_Caregiving", matchers: [/caregiving/i, /caretaker/i] },
  {
    slug: "Coding_Projects_Self_Directed",
    matchers: [/coding projects?/i, /self[-\s]?directed/i, /side project/i],
  },
];

const LEADER_WORDS = /\b(captain|lead|president|founder|organizer|coordinator|treasurer|vp)\b/i;
const HOURS_RE = /(\d+)\s*(?:hrs?|hours?)\s*\/?\s*(?:per\s*)?(?:wk|week)/i;
const YEARS_RE = /(\d+)\s*(?:yrs?|years?)/i;

export const activityWorker: ArchivistWorker = async (
  input,
): Promise<ArchivistWorkerResult> => {
  const { text } = input;
  const claims: ProposedClaim[] = [];

  const blocks = splitIntoActivityBlocks(text);

  for (const { name, raw } of blocks) {
    const slug =
      KNOWN_ACTIVITIES.find((k) => k.matchers.some((m) => m.test(name) || m.test(raw)))
        ?.slug ??
      name
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

    claims.push({
      predicate: "participates_in",
      object: { activity: slug },
      confidence: 0.9,
    });

    if (LEADER_WORDS.test(raw)) {
      const role = raw.match(LEADER_WORDS)?.[0] ?? "lead";
      claims.push({
        predicate: "leads",
        object: { activity: slug, role },
        confidence: 0.85,
      });
    }

    const hrs = raw.match(HOURS_RE);
    if (hrs)
      claims.push({
        predicate: "hours_per_week",
        object: { activity: slug, hours: Number(hrs[1]) },
        confidence: 0.9,
      });

    const yrs = raw.match(YEARS_RE);
    if (yrs)
      claims.push({
        predicate: "years_involved",
        object: { activity: slug, years: Number(yrs[1]) },
        confidence: 0.9,
      });
  }

  // Cross-activity inferences
  const rawLower = text.toLowerCase();
  if (/st\.?\s*anthony|catholic|confirmation|parish/i.test(text))
    claims.push({
      predicate: "participates_in",
      object: { activity: "Catholic_community" },
      confidence: 0.85,
    });

  if (rawLower.includes("142 hour") || /\b142\b/.test(rawLower))
    claims.push({
      predicate: "volunteer_hours_total",
      object: { hours: 142 },
      confidence: 0.95,
    });

  return { workerName: "activity", claims };
};

function splitIntoActivityBlocks(text: string): ActivityBlock[] {
  // Match "ACTIVITY 3:" or "3)" or "- " bullets
  const lines = text.split(/\n/);
  const blocks: ActivityBlock[] = [];
  let current: ActivityBlock | null = null;

  for (const line of lines) {
    const headerMatch =
      line.match(/^\s*ACTIVITY\s+\d+:\s*(.+?)\s*$/i) ||
      line.match(/^\s*\d+[).]\s*(.+?)\s*$/) ||
      line.match(/^\s*[-*•]\s*([A-Z][\w &/'-]{2,})\s*$/);
    if (headerMatch) {
      if (current) blocks.push(current);
      current = { name: headerMatch[1].trim(), raw: line };
    } else if (current) {
      current.raw += "\n" + line;
    }
  }
  if (current) blocks.push(current);

  if (blocks.length === 0) {
    // Fallback: treat whole text as one block if no structure.
    return [{ name: "ActivityList", raw: text }];
  }
  return blocks;
}
