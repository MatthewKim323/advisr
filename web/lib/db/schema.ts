/**
 * The MVP schema. 4 core tables.
 *
 * Deferred to post-MVP (designed but not built):
 *   - evidence_units — fine-grained chunks supporting claims
 *   - relationships  — edges between entities
 *   - embeddings     — vectors for semantic search
 *
 * See PLAN.md §5 for the design discipline behind these choices.
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const claimStatus = pgEnum("claim_status", [
  "pending",
  "confirmed",
  "rejected",
  "superseded",
]);

export const sensitivity = pgEnum("sensitivity", ["low", "medium", "high"]);

// ---------- source_files ----------
// Raw uploaded artifacts. Nothing ever thrown away.
export const sourceFiles = pgTable("source_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull(),
  kind: text("kind").notNull(),            // transcript | essay | voice | financial | photo | activities
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// ---------- artifacts ----------
// Parsed units extracted from source files.
// 1 transcript PDF → 40 `grade_row` artifacts.
// 1 essay → 1 `essay_draft`.
// 1 voice memo → 1 transcript + N `topic_segment` artifacts.
export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceFileId: uuid("source_file_id").references(() => sourceFiles.id).notNull(),
  kind: text("kind").notNull(),            // grade_row | essay_draft | topic_segment | financial_line | photo_scene
  content: jsonb("content").notNull(),     // kind-specific payload
  position: integer("position"),           // ordering within source file when applicable
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- claims ----------
// Typed facts about the student. See predicates.ts for the controlled vocabulary.
export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull(),
  subjectEntity: text("subject_entity").notNull().default("Student"),
  predicate: text("predicate").notNull(),  // FK to predicate vocab (validated in app code)
  object: jsonb("object").notNull(),       // compound objects stored as JSON
  confidence: real("confidence").notNull(),
  status: claimStatus("status").notNull().default("pending"),
  sensitivity: sensitivity("sensitivity").notNull().default("low"),

  sourceArtifactId: uuid("source_artifact_id").references(() => artifacts.id),
  extractedBy: text("extracted_by").notNull(),  // worker name or 'user'
  reasoning: text("reasoning"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

// ---------- entities ----------
// Deduplicated nouns. "Stanford" is ONE entity even if mentioned 12 times.
export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),            // course | activity | person | place | theme | school | ...
  canonicalName: text("canonical_name").notNull(),
  aliases: jsonb("aliases").notNull().default([]),
  meta: jsonb("meta").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
