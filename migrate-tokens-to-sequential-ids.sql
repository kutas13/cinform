-- =============================================================================
-- FOX VIZE — Access Token'ları sıralı ID'lere dönüştürür
--   Eski format: fv_<random>_<timestamp>  (ör: fv_aBc123...xyz_1700000000000)
--   Yeni format: fv_0001, fv_0002, fv_0003 ...
--
-- Supabase > SQL Editor'da bu dosyayı tek seferde çalıştırın.
-- =============================================================================

BEGIN;

-- 1) Mevcut formları created_at sırasına göre yeniden numaralandır
--    (Önce geçici bir değere alıp sonra kalıcı değere yazıyoruz; böylece UNIQUE
--     kısıtı varsa "aynı token" hatası yemiyoruz.)

WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS row_num
  FROM forms
)
UPDATE forms f
SET access_token = 'tmp_' || n.row_num::text
FROM numbered n
WHERE f.id = n.id;

WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS row_num
  FROM forms
)
UPDATE forms f
SET access_token = 'fv_' || LPAD(n.row_num::text, 4, '0')
FROM numbered n
WHERE f.id = n.id;

-- 2) Yeni form oluşturulduğunda bir sonraki sıralı token'ı üreten fonksiyon.
--    RPC olarak çağrılacak: supabase.rpc('next_form_token')

CREATE OR REPLACE FUNCTION next_form_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_num integer;
  next_num integer;
BEGIN
  SELECT COALESCE(
    MAX(CAST(substring(access_token FROM 'fv_([0-9]+)$') AS integer)),
    0
  )
  INTO max_num
  FROM forms
  WHERE access_token ~ '^fv_[0-9]+$';

  next_num := max_num + 1;

  RETURN 'fv_' || LPAD(next_num::text, 4, '0');
END;
$$;

-- 3) Fonksiyona public erişim ver (authenticated kullanıcılar çağırabilsin)
GRANT EXECUTE ON FUNCTION next_form_token() TO anon, authenticated;

COMMIT;

-- =============================================================================
-- Test için:
--   SELECT access_token FROM forms ORDER BY created_at;
--   SELECT next_form_token();
-- =============================================================================
