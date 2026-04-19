# Aisha Thompson

Generalization-test persona. Same extraction pipeline, different shape of
student. Where Maria tests "does the flagship case sing?", Aisha tests
"does the pipeline generalize beyond our demo fixture?"

## Profile

- Rural Georgia, single-parent household
- Pell-eligible
- Portfolio-track arts applicant (visual art + photography)
- First-gen
- Interested in SCAD, RISD (reach), UGA (safety)
- Heritage: Black American

## Artifacts

| File | Kind | Why |
|---|---|---|
| `01_transcript.txt` | transcript | Tests TranscriptReader on a different HS format (fewer APs, more dual-enrollment). |
| `02_common_app_essay.txt` | essay | Themes: mother, photography, community. Tests EssayParser beyond Maria's pattern. |
| `03_activities_list.txt` | activity | Art-heavy activities: portfolio class, yearbook, church. Tests ActivityExtractor on non-STEM. |
| `04_financial_info.txt` | financial | Lower AGI, single parent, Pell-eligible — different numeric shape than Maria's. |

## Expected claims (truncated)

- `has_gpa` 3.54 (unweighted)
- `pell_eligible` true
- `first_gen` true
- `household_agi` 31500
- `essay_theme` mother
- `essay_theme` photography
- `participates_in` Yearbook
- `participates_in` Photography_Club
- `considering_school` SCAD
- `considering_school` UGA
- `home_state_residency` GA
