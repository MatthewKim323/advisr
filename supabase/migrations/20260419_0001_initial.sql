-- Supabase migration mirror.
-- Run with `supabase db push` or apply manually via the SQL editor.
-- Includes Storage bucket + RLS policies that the Drizzle-managed file omits.

-- 1) Schema (same as web/lib/db/migrations/0000_initial.sql).
\i ../../web/lib/db/migrations/0000_initial.sql

-- 2) Storage bucket for uploaded artifacts.
INSERT INTO storage.buckets (id, name, public)
VALUES ('source-files', 'source-files', false)
ON CONFLICT (id) DO NOTHING;

-- 3) RLS: students can only see their own rows.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_self_read"
  ON students FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "source_files_self_rw"
  ON source_files FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()));

CREATE POLICY "claims_self_rw"
  ON claims FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()));

CREATE POLICY "events_self_read"
  ON events FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()));

CREATE POLICY "artifacts_via_source"
  ON artifacts FOR ALL
  USING (source_file_id IN (
    SELECT id FROM source_files
    WHERE student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "chunks_via_source"
  ON chunks FOR ALL
  USING (source_file_id IN (
    SELECT id FROM source_files
    WHERE student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "relationships_self"
  ON relationships FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()));

-- 4) Storage RLS: uploads scoped to student's own folder.
CREATE POLICY "storage_source_files_self"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'source-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- 5) Demo student row (seeded for DEMO_MODE).
-- Fixed UUID so /office?demo=maria is reproducible.
INSERT INTO students (id, display_name)
VALUES ('00000000-0000-4000-8000-000000000001', 'Maria Ortiz (demo)')
ON CONFLICT (id) DO NOTHING;
