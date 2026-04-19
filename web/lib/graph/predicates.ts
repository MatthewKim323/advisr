/**
 * The controlled predicate vocabulary. ~70 typed predicates.
 *
 * HARD RULE: Every claim uses a predicate from this list. Agents do not
 * invent new predicates at runtime. The vocabulary grows between versions
 * but NEVER mid-session.
 *
 * Without this, Scout writes `interested_in: CS`, Draft writes
 * `passionate_about: computer_science`, and Match-Maker can't find either.
 *
 * See PLAN.md §5.5 for the full rationale.
 */

export const PREDICATES = {
  // -------- Academic --------
  takes_course: { category: "academic", writtenBy: ["TranscriptReader"] },
  grade_in: { category: "academic", writtenBy: ["TranscriptReader"] },
  gpa_overall: { category: "academic", writtenBy: ["TranscriptReader"] },
  gpa_weighted: { category: "academic", writtenBy: ["TranscriptReader"] },
  test_score: { category: "academic", writtenBy: ["TranscriptReader", "user"] },
  rigor_tier: { category: "academic", writtenBy: ["TranscriptReader"] },
  class_rank: { category: "academic", writtenBy: ["TranscriptReader"] },
  graduation_year: { category: "academic", writtenBy: ["TranscriptReader", "inference"] },

  // -------- Identity / Demographics (high sensitivity) --------
  has_demographic: { category: "identity", writtenBy: ["PhotoAnalyzer", "user"], sensitivity: "high" },
  first_gen: { category: "identity", writtenBy: ["FinancialParser", "inference"], sensitivity: "medium" },
  identifies_as_religion: { category: "identity", writtenBy: ["PhotoAnalyzer", "EssayParser"], sensitivity: "high" },
  speaks_language: { category: "identity", writtenBy: ["EssayParser", "VoiceTranscriber"] },
  lives_in: { category: "identity", writtenBy: ["FinancialParser", "user"] },
  home_state_residency: { category: "identity", writtenBy: ["FinancialParser", "inference"] },
  citizenship_status: { category: "identity", writtenBy: ["user"], sensitivity: "high" },

  // -------- Interests & Personality --------
  interested_in: { category: "interests", writtenBy: ["EssayParser", "VoiceTranscriber", "PhotoAnalyzer"] },
  passionate_about: { category: "interests", writtenBy: ["EssayParser", "VoiceTranscriber"] },
  worries_about: { category: "interests", writtenBy: ["VoiceTranscriber", "EssayParser"] },
  curious_about: { category: "interests", writtenBy: ["VoiceTranscriber", "EssayParser"] },
  identifies_with_value: { category: "interests", writtenBy: ["EssayParser"] },
  personality_signal: { category: "interests", writtenBy: ["EssayParser", "VoiceTranscriber"] },

  // -------- Activities --------
  participates_in: { category: "activities", writtenBy: ["ActivityExtractor"] },
  leads: { category: "activities", writtenBy: ["ActivityExtractor"] },
  hours_per_week: { category: "activities", writtenBy: ["ActivityExtractor"] },
  years_involved: { category: "activities", writtenBy: ["ActivityExtractor"] },
  works_at: { category: "activities", writtenBy: ["ActivityExtractor"] },
  achievement: { category: "activities", writtenBy: ["ActivityExtractor"] },
  volunteer_hours_total: { category: "activities", writtenBy: ["ActivityExtractor"] },

  // -------- Family / Financial --------
  family_income: { category: "financial", writtenBy: ["FinancialParser"], sensitivity: "high" },
  household_size: { category: "financial", writtenBy: ["FinancialParser"] },
  parent_education_max: { category: "financial", writtenBy: ["FinancialParser", "user"] },
  number_of_siblings: { category: "financial", writtenBy: ["FinancialParser"] },
  pell_eligible: { category: "financial", writtenBy: ["FinancialParser", "inference"] },
  efc_sai: { category: "financial", writtenBy: ["FinancialParser"] },
  single_parent_household: { category: "financial", writtenBy: ["FinancialParser"] },

  // -------- Essays --------
  wrote_essay_for_prompt: { category: "essays", writtenBy: ["EssayParser"] },
  essay_theme: { category: "essays", writtenBy: ["EssayParser", "Draft"] },
  essay_voice: { category: "essays", writtenBy: ["EssayParser", "Draft"] },
  essay_weakness: { category: "essays", writtenBy: ["Draft"] },
  essay_word_count: { category: "essays", writtenBy: ["EssayParser"] },
  essay_revision_of: { category: "essays", writtenBy: ["EssayParser"] },

  // -------- Goals & Preferences --------
  wants_to_study: { category: "goals", writtenBy: ["EssayParser", "VoiceTranscriber", "user"] },
  wants_school_type: { category: "goals", writtenBy: ["VoiceTranscriber", "user"] },
  wants_school_size: { category: "goals", writtenBy: ["VoiceTranscriber", "user"] },
  wants_geo_region: { category: "goals", writtenBy: ["VoiceTranscriber", "user"] },
  open_to_geo_region: { category: "goals", writtenBy: ["VoiceTranscriber", "user"] },
  dream_school: { category: "goals", writtenBy: ["VoiceTranscriber", "EssayParser"] },
  career_goal: { category: "goals", writtenBy: ["EssayParser", "VoiceTranscriber"] },
  max_tuition_willingness: { category: "goals", writtenBy: ["VoiceTranscriber", "user"] },

  // -------- Schools --------
  considering_school: { category: "schools", writtenBy: ["Match-Maker"] },
  applied_to: { category: "schools", writtenBy: ["Pacer", "user"] },
  accepted_to: { category: "schools", writtenBy: ["user"] },
  rejected_by: { category: "schools", writtenBy: ["user"] },
  waitlisted_at: { category: "schools", writtenBy: ["user"] },
  true_cost_at: { category: "schools", writtenBy: ["Bursar"] },
  aid_offer_from: { category: "schools", writtenBy: ["Bursar", "user"] },

  // -------- Scholarships --------
  eligible_for_scholarship: { category: "scholarships", writtenBy: ["Scout"] },
  applied_for_scholarship: { category: "scholarships", writtenBy: ["user"] },
  won_scholarship: { category: "scholarships", writtenBy: ["user"] },

  // -------- Deadlines --------
  deadline_for: { category: "deadlines", writtenBy: ["Pacer"] },
  milestone_completed: { category: "deadlines", writtenBy: ["Pacer", "user"] },

  // -------- Meta --------
  source_file_ingested: { category: "meta", writtenBy: ["Archivist"] },
  claim_disputed_by_user: { category: "meta", writtenBy: ["ProposalQueue"] },
} as const;

export type Predicate = keyof typeof PREDICATES;

/** Narrow sensitivity lookup used by the ProposalQueue surface-gate. */
export function sensitivityOf(p: Predicate): "low" | "medium" | "high" {
  const meta = PREDICATES[p] as { sensitivity?: "low" | "medium" | "high" };
  return meta.sensitivity ?? "low";
}
