/**
 * EssayParser worker.
 *
 * Input:  docx/txt essay (via mammoth for docx)
 * Output: essay_draft artifact + claims:
 *           wrote_essay_for_prompt · essay_theme · essay_voice
 *           essay_word_count · essay_revision_of · interested_in
 *           passionate_about · speaks_language (if bilingual cue)
 *
 * Needed for Draft's callback feature — the grandmother-redundancy catch.
 */

export async function runEssayParser(_sourceFileId: string) {
  throw new Error("not implemented");
}
