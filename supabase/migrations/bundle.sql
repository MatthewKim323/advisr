-- =====================================================================
-- Nami — one-shot bootstrap SQL.
-- Paste this whole file into Supabase Dashboard → SQL Editor → Run.
-- Idempotent: safe to re-run; relies on IF NOT EXISTS + ON CONFLICT +
-- DROP POLICY IF EXISTS so repeated execution converges on the same state.
-- =====================================================================

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

-- ---------- Tables ----------
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file_id UUID NOT NULL REFERENCES source_files(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  content JSONB NOT NULL,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_artifacts_source_file ON artifacts(source_file_id);

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

CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_entities_kind_name ON entities(kind, canonical_name);

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

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_student_created ON events(student_id, created_at DESC);

-- ---------- Realtime publications (ignore "already member" errors) ----------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE events;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE claims;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------- Storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('source-files', 'source-files', false)
ON CONFLICT (id) DO NOTHING;

-- ---------- RLS ----------
ALTER TABLE students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_files  ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_self_read" ON students;
CREATE POLICY "students_self_read"
  ON students FOR SELECT
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "source_files_self_rw" ON source_files;
CREATE POLICY "source_files_self_rw"
  ON source_files FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "claims_self_rw" ON claims;
CREATE POLICY "claims_self_rw"
  ON claims FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "events_self_read" ON events;
CREATE POLICY "events_self_read"
  ON events FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "artifacts_via_source" ON artifacts;
CREATE POLICY "artifacts_via_source"
  ON artifacts FOR ALL
  USING (source_file_id IN (
    SELECT id FROM source_files
    WHERE student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "chunks_via_source" ON chunks;
CREATE POLICY "chunks_via_source"
  ON chunks FOR ALL
  USING (source_file_id IN (
    SELECT id FROM source_files
    WHERE student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "relationships_self" ON relationships;
CREATE POLICY "relationships_self"
  ON relationships FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "storage_source_files_self" ON storage.objects;
CREATE POLICY "storage_source_files_self"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'source-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- ---------- Demo student ----------
INSERT INTO students (id, display_name)
VALUES ('00000000-0000-4000-8000-000000000001', 'Maria Ortiz (demo)')
ON CONFLICT (id) DO NOTHING;
