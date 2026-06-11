-- =============================================================================
-- FOX VIZE — Not sistemi
--   Her kayit tipine (customer, chinese_company, turkish_company) not eklenebilir.
--   RLS ile kullanici sadece kendi notlarini gorur.
--
-- Supabase > SQL Editor'da bu dosyayi calistirin.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customer', 'chinese_company', 'turkish_company')),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notes_entity_idx ON notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS notes_created_by_idx ON notes(created_by);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notes" ON notes;
CREATE POLICY "Users can read own notes"
  ON notes FOR SELECT TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE TO authenticated
  USING (created_by = auth.uid());

COMMIT;
