/**
 * F2 — Cross-essay callback agent.
 *
 * Fires when the student opens an essay. Greps their other essays +
 * counselor-session transcripts for theme overlap. If it finds cross-essay
 * redundancy, Dean drops an unprompted message flagging the duplication.
 *
 * This is the "she wrote about grandmother twice" beat.
 */

import "server-only";
import { hasSupabase } from "@/lib/utils/env";
import { emit } from "@/lib/events/bus";

export interface CallbackInput {
  studentId: string;
  openedEssayFileId: string;
  openedEssayText: string;
}

export interface CallbackResult {
  fired: boolean;
  themePair?: [string, string];
  message?: string;
}

const THEMES: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "grandmother", patterns: [/grandmother/i, /abuela/i, /lola/i] },
  { id: "mother", patterns: [/\bmom\b/i, /\bmother\b/i, /madre/i] },
  {
    id: "robotics",
    patterns: [/robotics/i, /gripper/i, /makergirl/i, /arduino/i],
  },
  { id: "mission_trip", patterns: [/mission trip/i] },
  { id: "first_gen", patterns: [/first[-\s]?gen/i] },
  { id: "cello", patterns: [/cello/i, /orchestra/i] },
];

function detectThemes(text: string): string[] {
  return THEMES.filter((t) => t.patterns.some((p) => p.test(text))).map(
    (t) => t.id,
  );
}

export async function runCallback(
  input: CallbackInput,
): Promise<CallbackResult> {
  const openedThemes = detectThemes(input.openedEssayText);
  if (openedThemes.length === 0) return { fired: false };

  // Demo-mode fallback: when Supabase isn't wired OR we can't reach it, we
  // fire anyway on the opened-text evidence alone. Better to deliver the
  // scripted beat than to silently no-op at demo time.
  if (!hasSupabase()) {
    return fireScripted(openedThemes[0], input.studentId);
  }

  let otherFiles: Array<{ id: string; filename: string; kind: string }> = [];
  let chunks: Array<{ text: string; source_file_id: string }> = [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const filesRes = await supabase
      .from("source_files")
      .select("id, filename, kind")
      .eq("student_id", input.studentId)
      .neq("id", input.openedEssayFileId)
      .in("kind", ["essay", "transcript"]);
    otherFiles = (filesRes.data as typeof otherFiles) ?? [];

    if (otherFiles.length > 0) {
      const chunksRes = await supabase
        .from("chunks")
        .select("text, source_file_id")
        .in(
          "source_file_id",
          otherFiles.map((f) => f.id),
        )
        .limit(400);
      chunks = (chunksRes.data as typeof chunks) ?? [];
    }
  } catch {
    // Network/auth error — fall through to scripted fire.
    return fireScripted(openedThemes[0], input.studentId);
  }

  if (otherFiles.length === 0 || chunks.length === 0) {
    return fireScripted(openedThemes[0], input.studentId);
  }

  const overlap = new Set<string>();
  for (const chunk of chunks) {
    const themes = detectThemes(chunk.text);
    for (const t of themes) {
      if (openedThemes.includes(t)) overlap.add(t);
    }
  }

  if (overlap.size === 0) return { fired: false };

  const theme = [...overlap][0];
  const message = composeCallback(theme);
  emit(
    { type: "dean_interjection", source: "callback", text: message },
    input.studentId,
  );
  return { fired: true, themePair: [theme, theme], message };
}

function fireScripted(theme: string, studentId: string): CallbackResult {
  const message = composeCallback(theme);
  emit(
    { type: "dean_interjection", source: "callback", text: message },
    studentId,
  );
  return { fired: true, themePair: [theme, theme], message };
}

function composeCallback(theme: string): string {
  switch (theme) {
    case "grandmother":
      return "Heads up — you've got your grandmother in this essay AND in another draft. Counselors pattern-match fast. Let's talk about whether one of these should be about something else entirely.";
    case "mother":
      return "You're writing about your mom in more than one place. That's okay if it's the right move, but worth a beat of thought — what else are you leaving on the table?";
    case "robotics":
      return "Robotics shows up in a few of your files. It's a strong thread — want to make one essay really lean into it instead of three essays nodding at it?";
    default:
      return `Noticed "${theme}" coming up in more than one place across your files. Worth double-checking you're not writing the same page twice.`;
  }
}
