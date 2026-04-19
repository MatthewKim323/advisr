/**
 * ActivityExtractor worker.
 *
 * Input:  resume / Common App activities list (txt or structured)
 * Output: activity claims — participates_in · leads · hours_per_week
 *           years_involved · works_at · achievement · volunteer_hours_total
 *
 * Priority-cut candidate: fold into EssayParser if time runs short.
 */

export async function runActivityExtractor(_sourceFileId: string) {
  throw new Error("not implemented");
}
