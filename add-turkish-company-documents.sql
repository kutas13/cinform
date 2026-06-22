-- =============================================================================
-- FOX VIZE — Turk sirketlerine kaseli kagit belgesi yukleme destegi
--   * 1 belge: stamped_paper (kaseli kagit)
--   * Dosyalar mevcut "company-documents" bucket'inde tutulur
--   * Path: {user_id}/{company_id}/stamped_paper-{timestamp}.{ext}
--   * Bucket ve RLS politikalari add-chinese-company-documents.sql ile zaten kurulu
--     (ayni bucket, ayni policy'ler — turkish_companies icin ekstra bir sey gerekmez).
--
-- Supabase > SQL Editor'da bu dosyayi tek seferde calistirin.
-- =============================================================================

BEGIN;

ALTER TABLE turkish_companies
  ADD COLUMN IF NOT EXISTS stamped_paper_file_path TEXT,
  ADD COLUMN IF NOT EXISTS stamped_paper_file_name TEXT;

COMMIT;

-- =============================================================================
-- Test:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'turkish_companies'
--       AND column_name LIKE '%file%';
-- =============================================================================
