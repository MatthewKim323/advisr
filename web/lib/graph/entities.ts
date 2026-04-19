/**
 * Deduplicated nouns — courses, activities, people, places, themes, schools,
 * goals. "Stanford" is ONE entity even if mentioned 12 times.
 */

export type EntityKind =
  | "course"
  | "activity"
  | "person"
  | "place"
  | "theme"
  | "school"
  | "scholarship"
  | "major"
  | "essay"
  | "goal";

export interface Entity {
  id: string;
  kind: EntityKind;
  canonicalName: string;
  aliases: string[];
  meta: Record<string, unknown>;
}

export async function upsert(_kind: EntityKind, _name: string): Promise<Entity> {
  throw new Error("not implemented");
}
