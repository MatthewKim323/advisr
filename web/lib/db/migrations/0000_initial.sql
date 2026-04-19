-- Nami initial schema. Run against Supabase Postgres.
-- Matches lib/db/schema.ts. Idempotent via IF NOT EXISTS where possible.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Enums ----------
DO $$ BEGIN
  CREATE TYPE claim_status AS ENUM ('pending', 'confirmed', 'rejected', 'superseded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE sensitivity AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE source_kind AS ENUM (
    'transcript', 'essay', 'financial', 'activity',
    'college-profile', 'scholarship', 'aid-policy', 'style-guide'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------- students ----------
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- source_files ----------
CREATE TABLE IF NOT EXISTS source_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_source_files_student ON source_files(student_id, uploaded_at DESC);

-- ---------- artifacts ----------
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file_id UUID NOT NULL REFERENCES source_files(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  content JSONB NOT NULL,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_artifacts_source_file ON artifacts(source_file_id);

-- ---------- chunks ----------
CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file_id UUID NOT NULL REFERENCES source_files(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  source_kind source_kind NOT NULL,
  text TEXT NOT NULL,
  offset_start INTEGER,
  offset_end INTEGER,
  hd_chunk_id TEXT,
  tokens JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chunks_source_file ON chunks(source_file_id);
CREATE INDEX IF NOT EXISTS idx_chunks_source_kind ON chunks(source_kind);

-- ---------- claims ----------
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_entity TEXT NOT NULL DEFAULT 'Student',
  predicate TEXT NOT NULL,
  object JSONB NOT NULL,
  confidence REAL NOT NULL,
  status claim_status NOT NULL DEFAULT 'pending',
  sensitivity sensitivity NOT NULL DEFAULT 'low',
  source_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  source_chunk_id UUID REFERENCES chunks(id) ON DELETE SET NULL,
  source_file_id UUID REFERENCES source_files(id) ON DELETE SET NULL,
  extracted_by TEXT NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_claims_student_status ON claims(student_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_predicate ON claims(predicate);
CREATE UNIQUE INDEX IF NOT EXISTS uq_claims_source_predicate
  ON claims(source_file_id, predicate, subject_entity);

-- ---------- entities ----------
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_entities_kind_name ON entities(kind, canonical_name);

-- ---------- relationships ----------
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  predicate TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  source_claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rel_student ON relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_rel_from ON relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_rel_to ON relationships(to_entity_id);

-- ---------- events ----------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_student_created ON events(student_id, created_at DESC);

-- ---------- Realtime ----------
-- Supabase Realtime: broadcast inserts on events + claims.
-- (Must run as admin; Supabase dashboard can also flip these.)
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE claims;
