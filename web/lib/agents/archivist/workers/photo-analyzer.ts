/**
 * PhotoAnalyzer worker.
 *
 * Input:  images (confirmation photos, room, art portfolio)
 * Output: claims — identifies_as_religion · interested_in · has_demographic
 *           · essay_theme candidates
 *
 * Uses gpt-4o-mini-vision. ALL outputs tagged sensitivity=high and require
 * explicit user confirmation before surfacing to downstream agents. The
 * "Catholic from confirmation photo" claim never auto-populates UI tags.
 *
 * Priority-cut: this is the first worker to cut if time collapses. The
 * Catholic callback can be recovered from EssayParser (St. Anthony's activity).
 */

export async function runPhotoAnalyzer(_sourceFileId: string) {
  throw new Error("not implemented");
}
