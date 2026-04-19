/**
 * VoiceTranscriber worker.
 *
 * Input:  mp3/wav voice memo
 * Output: transcript artifact + N topic_segment artifacts + claims:
 *           dream_school · career_goal · worries_about · curious_about
 *           personality_signal · wants_school_type/size · speaks_language
 *
 * Uses OpenAI Whisper for transcription, then Haiku for claim extraction.
 * Load-bearing for Maria's "Mr. Arellano propeller moment" callback.
 */

export async function runVoiceTranscriber(_sourceFileId: string) {
  throw new Error("not implemented");
}
