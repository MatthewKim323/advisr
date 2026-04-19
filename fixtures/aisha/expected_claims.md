# Expected claims — Aisha

Ground truth for the generalization test. If the pipeline works on Maria
but fails on Aisha, we know we overfit.

## From 01_transcript.txt (TranscriptReader)

- has_gpa: 3.54 (unweighted)
- has_gpa_weighted: 3.77
- has_class_rank: {rank: 48, out_of: 212}
- graduation_year: 2026
- rigor_tier: most_demanding_available
- has_test_score: {SAT_total, 1130}
- has_test_score: {SAT_ERW, 590}
- has_test_score: {SAT_math, 540}
- takes_course: English_11_AP
- takes_course: Psychology_AP
- takes_course: Studio_Art_AP
- has_test_score: {AP_English_Language, 3}
- has_test_score: {AP_Psychology, 4}

## From 02_common_app_essay.txt (EssayParser)

- wrote_essay_for_prompt: {essay, CommonApp_Prompt_1}
- essay_theme: Mother
- essay_theme: Creativity
- essay_voice: reflective

## From 03_activities_list.txt (ActivityExtractor)

- participates_in: Yearbook (or staff_photographer variant)
- leads: {Photography_Club, President, 2026}
- years_involved: {Photography_Club, 4}
- participates_in: Photography_Club
- participates_in: Bethlehem_AME_Youth_Ministry (or Catholic/AME community variant)
- volunteer_hours_total: 210
- participates_in: Piggly_Wiggly (or employment variant)

## From 04_financial_info.txt (FinancialParser)

- household_agi: 31500
- household_size: 3
- first_gen: true
- pell_eligible: true
- efc_sai: 0
- home_state_residency: GA
- single_parent_household: true
- parent_education_max: hs
- max_unsubsidized_loan_per_year: 5500
- max_total_debt_target: 22000
- willing_to_take_parent_plus: false
