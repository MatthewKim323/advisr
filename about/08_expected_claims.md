EXPECTED CLAIMS — MARIA DELGADO SANTOS
Ground truth rubric for Archivist workers.

When Maria's artifacts are ingested, these are the claims that the system
SHOULD produce. Use this to test each worker's accuracy and to pre-populate
the demo-mode graph if workers aren't fully reliable.

──────────────────────────────────────────────────────────

FROM 01_transcript.txt (TranscriptReader)

Academic claims (confidence should be ~0.99 — extracted from structured data):
  - gpa_overall: 3.72
  - gpa_weighted: 4.21
  - class_rank: {62, 480}
  - graduation_year: 2027
  - rigor_tier: "most_rigorous"
  - test_score: {SAT_total, 1280}
  - test_score: {SAT_ERW, 650}
  - test_score: {SAT_math, 630}
  - test_score: {PSAT_total, 1220}

Course/grade claims (many, but these are the key ones for demo):
  - takes_course: AP_Biology
  - takes_course: AP_Calculus_AB
  - takes_course: AP_Chemistry
  - takes_course: AP_English_Language
  - takes_course: AP_Computer_Science
  - takes_course: AP_US_History
  - takes_course: AP_World_History
  - takes_course: AP_Spanish
  - grade_in: {AP_Chemistry_Spring_2026, B+}  ← THE STORY GRADE
  - grade_in: {AP_Lang, A}
  - grade_in: {AP_Calculus, A-}

AP exam scores:
  - test_score: {AP_Lang, 4}
  - test_score: {AP_US_History, 4}
  - test_score: {AP_World_History, 4}
  - test_score: {AP_Chemistry, 3}

──────────────────────────────────────────────────────────

FROM 02_common_app_essay_draft_v3.txt (EssayParser, then Draft)

EssayParser extractions:
  - wrote_essay_for_prompt: {essay_v3, CommonApp_Prompt_1}
  - essay_word_count: {essay_v3, 614}
  - essay_theme: {essay_v3, Grandmother}     ← KEY FOR CALLBACK
  - essay_theme: {essay_v3, Patience}
  - essay_theme: {essay_v3, Family_Sacrifice}
  - essay_voice: {essay_v3, reflective}
  - essay_voice: {essay_v3, earnest}

Draft callback claims (added by Draft agent, confidence ~0.75):
  - essay_weakness: {essay_v3, admissions_cliche_grandmother}
  - essay_weakness: {essay_v3, theme_overlaps_with_uc_piq}
  - essay_weakness: {essay_v3, weaker_than_available_alternative}

Implicit claims about Maria inferred from essay content:
  - passionate_about: Grandmother_Caretaking
  - wants_to_study: ComputerScience
  - career_goal: AssistiveTechnology
  - works_at: {In-N-Out, Cashier, 15}
  - participates_in: Soccer
  - leads: {Soccer, Captain, 2026}

──────────────────────────────────────────────────────────

FROM 03_uc_piq_draft.txt (EssayParser, then Draft)

EssayParser extractions:
  - wrote_essay_for_prompt: {piq_1, UC_PIQ_2}
  - essay_word_count: {piq_1, 343}
  - essay_theme: {piq_1, Grandmother}        ← DUPLICATE THEME
  - essay_theme: {piq_1, Creativity}
  - essay_theme: {piq_1, Robotics_Gripper_Project}
  - essay_voice: {piq_1, reflective}

Draft callback:
  - essay_weakness: {piq_1, theme_repeat_from_common_app_grandmother}

Implicit new claims from this essay:
  - achievement: Wheelchair_Arm_Gripper_Design
  - interested_in: HumanComputerInteraction  (inferred from silicone gripper work)

──────────────────────────────────────────────────────────

FROM 04_activities_list.txt (ActivityExtractor)

Activity claims:
  - participates_in: Soccer
  - leads: {Soccer, Captain, 2026}
  - years_involved: {Soccer, 4}
  - hours_per_week: {Soccer, 12}

  - participates_in: RoboticsClub
  - leads: {RoboticsClub_Outreach, Lead, 2025}
  - years_involved: {RoboticsClub, 4}
  - hours_per_week: {RoboticsClub, 8}
  - achievement: Long_Beach_Regional_Community_Impact_Award_2025

  - works_at: {In-N-Out Burger, Level_1_Cook, 15}
  - works_at: {In-N-Out Burger, Cashier, 15}  ← historical

  - participates_in: St_Anthonys_Youth_Group
  - leads: {St_Anthonys_Visit_Coordinator, 2026}
  - years_involved: {St_Anthonys_Youth_Group, 4}
  - volunteer_hours_total: 142

  - participates_in: AAPI_Student_Union
  - leads: {AAPI_Student_Union_Treasurer, 2026}

  - participates_in: Math_Tutoring
  - participates_in: Family_Caregiving   ← heavy signal, feeds Lola story
  - hours_per_week: {Family_Caregiving, 10}

  - participates_in: Coding_Projects_Self_Directed
  - interested_in: Medication_Reminder_App_Development

Cross-artifact inferences (after multi-artifact synthesis):
  - participates_in: Catholic_community  (St. Anthony's + confirmation photo)
  - identifies_as_religion: Catholic     (high-confidence after multi-signal)

──────────────────────────────────────────────────────────

FROM 05_financial_info.txt (FinancialParser)

Financial claims (all high confidence ~0.99):
  - family_income: 47200
  - household_size: 4
  - number_of_siblings: 1
  - parent_education_max: "hs"
  - first_gen: true
  - pell_eligible: true
  - efc_sai: 1800
  - single_parent_household: true   (noted: separated, custodial mother)
  - home_state_residency: CA

Derived / flagged claims:
  - considering_scholarship: QuestBridge         (rule-based flag)
  - considering_scholarship: Gates_Scholarship   (rule-based flag)
  - considering_scholarship: JKC                 (rule-based flag)

User-stated constraints (high-sensitivity, confirmed only):
  - max_unsubsidized_loan_per_year: 5500
  - max_total_debt_target: 27000
  - willing_to_take_parent_plus: false

──────────────────────────────────────────────────────────

FROM 06_voice_memo_transcript.txt (VoiceTranscriber)

Preference / goal claims:
  - considering_school: {CSU_Long_Beach, perceived_target}
  - considering_school: {CSU_Fullerton, perceived_target}
  - considering_school: {CSU_Northridge, perceived_target}
  - dream_school: Harvey_Mudd              ← KEY, not in any other file
  - interested_in: HumanComputerInteraction
  - career_goal: AssistiveTechnology_Elderly
  - wants_geo_region: SouthernCalifornia
  - max_drive_distance_from_home: 6_hours

Emotional / contextual claims (lower confidence, tag as inferred):
  - worries_about: Self_Worth_vs_Top_Schools  (confidence ~0.7)
  - worries_about: Family_Caregiving_Obligations  (confidence ~0.85)
  - personality_signal: self_doubting_high_achiever  (confidence ~0.75)

THE ROBOTICS STORY (the payoff):
  - wrote_essay_about: Robotics_Gripper_Project     (in voice memo only!)
  - contains_unpublished_narrative: Mr_Arellano_Propeller_Moment
  - essay_alternative_available: Arellano_Moment    ← Draft uses this for callback

──────────────────────────────────────────────────────────

FROM 07_confirmation_photo (PhotoAnalyzer)

If the photo is acquired and PhotoAnalyzer works:
  - identifies_as_religion: Catholic   (confidence ~0.95)
  - has_demographic: Filipino-American  (confidence ~0.75)
  - event: Catholic_Confirmation_Ceremony  (confidence ~0.90)
  - setting: Parish_Church

──────────────────────────────────────────────────────────

TOTAL EXPECTED CLAIMS: ~75-90

Breakdown:
  - ~35 from transcript (course + grade + test score claims)
  - ~15 from essays + PIQ
  - ~20 from activities
  - ~15 from financial + voice memo + photo

──────────────────────────────────────────────────────────

KEY SYNTHESIS CLAIMS (produced by Dean during session, not a worker)

These are claims the orchestrator synthesizes across multiple workers'
outputs — the "memory-first" magic that makes Advisr different:

  - essay_weakness_cross_artifact: {essay_v3, piq_1, repeat_grandmother}
  - Draft identifies the stronger essay topic hiding in the voice memo
  - Match-Maker identifies Harvey Mudd as fitting the stated dream
    despite Maria's self-doubt, based on HCI interest + 6hr constraint
  - Match-Maker adds Catholic meet-full-need schools (Santa Clara,
    Loyola Marymount, USD) based on religion claim + pell + academic
    profile
  - Bursar identifies that Santa Clara net cost < CSU Long Beach net cost
    (because meet-full-need vs. partial aid)
