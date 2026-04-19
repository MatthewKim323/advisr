/**
 * Nami schema.
 *
 * Core tables: students, source_files, artifacts, chunks, claims, entities,
 * relationships, events.
 *
 * chunks is the HD-native receipt primitive. Every claim points at a chunk.
 * Every UI citation points at a chunk. No chunk ID, no claim — design principle.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  jsonb,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const claimStatus = pgEnum("claim_status", [
  "pending",
  "confirmed",
  "rejected",
  "superseded",
]);

export const sensitivity = pgEnum("sensitivity", ["low", "medium", "high"]);

export const sourceKind = pgEnum("source_kind", [
  "transcript",
  "essay",
  "financial",
  "activity",
  "college-profile",
  "scholarship",
  "aid-policy",
  "style-guide",
]);

// ---------- students ----------
// Thin row. Auth identity lives in Supabase auth.users; this is Nami's profile.
export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").unique(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- source_files ----------
export const sourceFiles = pgTable(
  "source_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    kind: text("kind").notNull(), // transcript | essay | voice | financial | photo | activity
    filename: text("filename").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (t) => [index("idx_source_files_student").on(t.studentId, t.uploadedAt)],
);

// ---------- artifacts ----------
export const artifacts = pgTable(
  "artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceFileId: uuid("source_file_id")
      .references(() => sourceFiles.id, { onDelete: "cascade" })
      .notNull(),
    kind: text("kind").notNull(),
    content: jsonb("content").notNull(),
    position: integer("position"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_artifacts_source_file").on(t.sourceFileId)],
);

// ---------- chunks ----------
// HD-native receipt primitive.
// Every chunk has a stable ID the UI can use to link back.
// offsetStart/offsetEnd are byte offsets inside the source file text (when text).
export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceFileId: uuid("source_file_id")
      .references(() => sourceFiles.id, { onDelete: "cascade" })
      .notNull(),
    artifactId: uuid("artifact_id").references(() => artifacts.id, {
      onDelete: "set null",
    }),
    sourceKind: sourceKind("source_kind").notNull(),
    text: text("text").notNull(),
    offsetStart: integer("offset_start"),
    offsetEnd: integer("offset_end"),
    hdChunkId: text("hd_chunk_id"), // if synced to Human Delta, their chunk ID
    tokens: jsonb("tokens").notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_chunks_source_file").on(t.sourceFileId),
    index("idx_chunks_source_kind").on(t.sourceKind),
  ],
);

// ---------- claims ----------
export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    subjectEntity: text("subject_entity").notNull().default("Student"),
    predicate: text("predicate").notNull(),
    object: jsonb("object").notNull(),
    confidence: real("confidence").notNull(),
    status: claimStatus("status").notNull().default("pending"),
    sensitivity: sensitivity("sensitivity").notNull().default("low"),
    sourceArtifactId: uuid("source_artifact_id").references(() => artifacts.id, {
      onDelete: "set null",
    }),
    sourceChunkId: uuid("source_chunk_id").references(() => chunks.id, {
      onDelete: "set null",
    }),
    sourceFileId: uuid("source_file_id").references(() => sourceFiles.id, {
      onDelete: "set null",
    }),
    extractedBy: text("extracted_by").notNull(),
    reasoning: text("reasoning"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    confirmedAt: timestamp("confirmed_at"),
  },
  (t) => [
    index("idx_claims_student_status").on(t.studentId, t.status),
    index("idx_claims_predicate").on(t.predicate),
    // Idempotency: one claim per (source_file_id, predicate, object-hash).
    // object-hash not enforced by Postgres; app-level dedupe via propose().
    uniqueIndex("uq_claims_source_predicate").on(
      t.sourceFileId,
      t.predicate,
      t.subjectEntity,
    ),
  ],
);

// ---------- entities ----------
export const entities = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    canonicalName: text("canonical_name").notNull(),
    aliases: jsonb("aliases").notNull().default(sql`'[]'::jsonb`),
    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uq_entities_kind_name").on(t.kind, t.canonicalName)],
);

// ---------- relationships ----------
// Edges between entities + between claims. Feeds the KnowledgeConstellation.
export const relationships = pgTable(
  "relationships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    fromEntityId: uuid("from_entity_id")
      .references(() => entities.id, { onDelete: "cascade" })
      .notNull(),
    toEntityId: uuid("to_entity_id")
      .references(() => entities.id, { onDelete: "cascade" })
      .notNull(),
    predicate: text("predicate").notNull(),
    weight: real("weight").notNull().default(1.0),
    sourceClaimId: uuid("source_claim_id").references(() => claims.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_rel_student").on(t.studentId),
    index("idx_rel_from").on(t.fromEntityId),
    index("idx_rel_to").on(t.toEntityId),
  ],
);

// ---------- events ----------
// Source of truth for Realtime. Supabase Realtime broadcasts inserts.
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").references(() => students.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_events_student_created").on(t.studentId, t.createdAt)],
);
