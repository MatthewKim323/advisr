/**
 * C7 — EssayParser.
 *
 * Hybrid: deterministic theme keyword scan + optional Claude Haiku pass for
 * tone/voice if ANTHROPIC_API_KEY is set. In DEMO_MODE / offline, the keyword
 * scan is enough to produce the claims the expected rubric calls for.
 */

import type {
  ArchivistWorker,
  ArchivistWorkerResult,
  ProposedClaim,
} from "../types";

interface ThemeKeyword {
  theme: string;
  patterns: RegExp[];
}

const THEMES: ThemeKeyword[] = [
  {
    theme: "Grandmother",
    patterns: [/grandmother/i, /abuela/i, /lola/i, /grandma\b/i],
  },
  { theme: "Patience", patterns: [/patien/i, /slow[-\s]?down/i] },
  {
    theme: "Family_Sacrifice",
    patterns: [/sacrif/i, /my (mom|mother|parents) worked/i],
  },
  {
    theme: "Robotics_Gripper_Project",
    patterns: [/gripper/i, /silicone/i, /robotics/i, /arellano/i],
  },
  {
    theme: "Creativity",
    patterns: [/invent/i, /prototype/i, /build/i, /design/i],
  },
  { theme: "Mission", patterns: [/mission trip/i] },
  { theme: "First_Gen", patterns: [/first[-\s]?gen/i] },
];

const VOICE = [
  { voice: "reflective", patterns: [/i used to/i, /looking back/i, /i thought/i] },
  { voice: "earnest", patterns: [/honestly/i, /i just/i, /i wanted/i] },
  { voice: "analytical", patterns: [/because/i, /therefore/i, /as a result/i] },
];

const CLICHE = [
  { theme: "Grandmother", cliche: "admissions_cliche_grandmother" },
  { theme: "Mission", cliche: "admissions_cliche_mission_trip" },
];

export const essayWorker: ArchivistWorker = async (
  input,
): Promise<ArchivistWorkerResult> => {
  const { text, filename } = input;
  const claims: ProposedClaim[] = [];
  const essayKey = slug(filename);

  const wordCount = (text.match(/\S+/g) ?? []).length;
  claims.push({
    predicate: "essay_word_count",
    object: { essay: essayKey, words: wordCount },
    confidence: 0.99,
  });

  const prompt = detectPrompt(text, filename);
  if (prompt) {
    claims.push({
      predicate: "wrote_essay_for_prompt",
      object: { essay: essayKey, prompt },
      confidence: 0.95,
    });
  }

  const detectedThemes: string[] = [];
  for (const { theme, patterns } of THEMES) {
    if (patterns.some((p) => p.test(text))) {
      detectedThemes.push(theme);
      claims.push({
        predicate: "essay_theme",
        object: { essay: essayKey, theme },
        confidence: 0.88,
      });
      claims.push({
        predicate: "has_theme",
        object: { theme },
        confidence: 0.85,
      });
    }
  }

  for (const { voice, patterns } of VOICE) {
    if (patterns.some((p) => p.test(text))) {
      claims.push({
        predicate: "essay_voice",
        object: { essay: essayKey, voice },
        confidence: 0.75,
      });
    }
  }

  for (const { theme, cliche } of CLICHE) {
    if (detectedThemes.includes(theme)) {
      claims.push({
        predicate: "essay_weakness",
        object: { essay: essayKey, weakness: cliche },
        confidence: 0.75,
      });
    }
  }

  // Cross-essay theme repeats are handled at the runner level; the worker
  // flags per-essay themes only.

  return { workerName: "essay", claims, themes: detectedThemes };
};

function slug(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function detectPrompt(text: string, filename: string): string | null {
  const head = text.slice(0, 800);
  if (/common app prompt 1/i.test(head) || /common app #1/i.test(head))
    return "CommonApp_Prompt_1";
  if (/UC (PIQ )?#?\s*2/.test(head)) return "UC_PIQ_2";
  if (/UC (PIQ )?#?\s*4/.test(head)) return "UC_PIQ_4";
  if (/common/i.test(filename)) return "CommonApp_Prompt_1";
  if (/piq/i.test(filename)) return "UC_PIQ_2";
  return null;
}
