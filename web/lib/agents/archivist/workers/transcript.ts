/**
 * C5 — TranscriptReader.
 *
 * Deterministic regex-based extraction from the high-school transcript
 * format in /about/01_transcript.txt. No LLM: transcripts have enough
 * structure that we'd rather be reliable than clever.
 */

import type {
  ArchivistWorker,
  ArchivistWorkerResult,
  ProposedClaim,
} from "../types";

const GPA_RE = /Unweighted GPA[^:]*:\s*([0-9.]+)/i;
const WGPA_RE = /Weighted GPA[^:]*:\s*([0-9.]+)/i;
const RANK_RE = /Class Rank:\s*(\d+)\s+of\s+(\d+)/i;
const GRAD_RE = /Expected Graduation:\s*[A-Za-z]+\s+(\d{4})/i;
const RIGOR_RE = /Course Rigor[^:]*:\s*([A-Za-z ]+)/i;
const SAT_TOTAL_RE = /Total:\s+(\d{3,4})\b/;
const SAT_ERW_RE = /Evidence-Based Reading & Writing:\s+(\d{3,4})/i;
const SAT_MATH_RE = /Math:\s+(\d{3,4})/i;
const PSAT_RE = /PSAT[\s\S]*?Total:\s+(\d{3,4})/i;

// Grade rows: "    AP Biology ......... A-   AP"
const GRADE_ROW_RE =
  /^\s{2,}([A-Z][A-Za-z0-9/ ()&'.-]{3,50}?)\s*\.{2,}\s*([A-F][+-]?)\s+(R|H|AP)\s*$/gm;

// AP exam: "        AP Lang: 4"
const AP_EXAM_RE = /\b([A-Z][A-Za-z ]+?):\s+([1-5])\b/g;

export const transcriptWorker: ArchivistWorker = async (
  input,
): Promise<ArchivistWorkerResult> => {
  const claims: ProposedClaim[] = [];
  const push = (c: ProposedClaim) => claims.push(c);

  const t = input.text;

  const m = (re: RegExp) => t.match(re);
  const num = (val?: string) => (val ? Number(val) : null);

  if (m(GPA_RE))
    push({
      predicate: "has_gpa",
      object: { value: num(m(GPA_RE)![1]), scale: "unweighted_4" },
      confidence: 0.99,
      reasoning: "from Cumulative GPA Summary",
    });

  if (m(WGPA_RE))
    push({
      predicate: "has_gpa_weighted",
      object: { value: num(m(WGPA_RE)![1]), scale: "weighted_5" },
      confidence: 0.99,
    });

  if (m(RANK_RE)) {
    const r = m(RANK_RE)!;
    push({
      predicate: "has_class_rank",
      object: { rank: num(r[1]), out_of: num(r[2]) },
      confidence: 0.99,
    });
  }

  if (m(GRAD_RE))
    push({
      predicate: "graduation_year",
      object: { year: num(m(GRAD_RE)![1]) },
      confidence: 0.99,
    });

  if (m(RIGOR_RE))
    push({
      predicate: "rigor_tier",
      object: { tier: m(RIGOR_RE)![1].trim().toLowerCase().replace(/\s+/g, "_") },
      confidence: 0.98,
    });

  if (m(SAT_TOTAL_RE))
    push({
      predicate: "has_test_score",
      object: { test: "SAT_total", score: num(m(SAT_TOTAL_RE)![1]) },
      confidence: 0.99,
    });
  if (m(SAT_ERW_RE))
    push({
      predicate: "has_test_score",
      object: { test: "SAT_ERW", score: num(m(SAT_ERW_RE)![1]) },
      confidence: 0.99,
    });
  if (m(SAT_MATH_RE))
    push({
      predicate: "has_test_score",
      object: { test: "SAT_math", score: num(m(SAT_MATH_RE)![1]) },
      confidence: 0.99,
    });
  if (m(PSAT_RE))
    push({
      predicate: "has_test_score",
      object: { test: "PSAT_total", score: num(m(PSAT_RE)![1]) },
      confidence: 0.99,
    });

  // Courses
  const seenCourses = new Set<string>();
  let match: RegExpExecArray | null;
  const reCourse = new RegExp(GRADE_ROW_RE);
  while ((match = reCourse.exec(t)) !== null) {
    const [, rawName, grade, weight] = match;
    const name = normalizeCourseName(rawName);
    const key = `${name}|${weight}`;
    if (!seenCourses.has(key)) {
      seenCourses.add(key);
      push({
        predicate: "takes_course",
        object: { course: name, weight },
        confidence: 0.98,
      });
    }
    push({
      predicate: "has_grade",
      object: { course: name, grade, weight },
      confidence: 0.98,
    });
  }

  // AP exam scores — only in AP Exam Scores blocks
  const apExamBlocks = [...t.matchAll(/AP Exam Scores[^\n]*\n([\s\S]*?)\n\n/g)];
  for (const block of apExamBlocks) {
    const body = block[1];
    let em: RegExpExecArray | null;
    const reExam = new RegExp(AP_EXAM_RE);
    while ((em = reExam.exec(body)) !== null) {
      const [, test, score] = em;
      push({
        predicate: "has_test_score",
        object: { test: `AP_${test.trim().replace(/\s+/g, "_")}`, score: Number(score) },
        confidence: 0.99,
      });
    }
  }

  return { workerName: "transcript", claims };
};

function normalizeCourseName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, "_")
    .replace(/AP$/, "AP")
    .replace(/Honors$/, "H");
}
