-- =============================================================================
-- FOX VIZE — Cinli sirketlere belge yukleme destegi
--   * 3 belge: davetiye, faaliyet, ID kart
--   * Dosyalar Supabase Storage'de tutulur (bucket: company-documents)
--   * RLS ile kullanici sadece kendi belgelerine erisir
--
-- Supabase > SQL Editor'da bu dosyayi tek seferde calistirin.
-- =============================================================================

BEGIN;

-- 1) Yeni kolonlar: dosya yolu + orijinal isim (gostermek icin)
ALTER TABLE chinese_companies
  ADD COLUMN IF NOT EXISTS invitation_file_path       TEXT,
  ADD COLUMN IF NOT EXISTS invitation_file_name       TEXT,
  ADD COLUMN IF NOT EXISTS business_license_file_path TEXT,
  ADD COLUMN IF NOT EXISTS business_license_file_name TEXT,
  ADD COLUMN IF NOT EXISTS id_card_file_path          TEXT,
  ADD COLUMN IF NOT EXISTS id_card_file_name          TEXT;

COMMIT;

-- =============================================================================
-- 2) STORAGE BUCKET (Supabase Storage)
--    Bucket: company-documents  (private)
--    Path:   {user_id}/{company_id}/{doc_type}-{timestamp}.{ext}
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-documents',
  'company-documents',
  false,                       -- private bucket, signed URL ile erisim
  10485760,                    -- 10 MB max
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- 3) RLS POLITIKALARI — sadece dosyanin sahibi erisebilsin
--    Path'in ilk klasoru = auth.uid()::text olacak sekilde upload edilir
-- =============================================================================

-- Mevcut policy'leri temizle (idempotent calismasi icin)
DROP POLICY IF EXISTS "Users can read own company documents"   ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own company documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own company documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own company documents" ON storage.objects;

CREATE POLICY "Users can read own company documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own company documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own company documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own company documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- Test:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'chinese_companies'
--       AND column_name LIKE '%file%';
--   SELECT id, public FROM storage.buckets WHERE id = 'company-documents';
-- =============================================================================
