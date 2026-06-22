-- ================================================
-- CUSTOMERS TABLOSUNU GÜNCELLEME
-- ================================================

-- Önce mevcut tabloyu kontrol edelim
\d customers;

-- Eksik sütunu ekleyelim
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_province TEXT;

-- Eğer birth_province NULL ise NOT NULL yapamayız, önce değer verelim
UPDATE customers SET birth_province = birth_city WHERE birth_province IS NULL;

-- Şimdi NOT NULL yapalım
ALTER TABLE customers ALTER COLUMN birth_province SET NOT NULL;

-- Gereksiz sütunları kaldır (eğer varsa)
ALTER TABLE customers DROP COLUMN IF EXISTS passport_number;
ALTER TABLE customers DROP COLUMN IF EXISTS birth_date;
ALTER TABLE customers DROP COLUMN IF EXISTS address;
ALTER TABLE customers DROP COLUMN IF EXISTS phone;
ALTER TABLE customers DROP COLUMN IF EXISTS email;
ALTER TABLE customers DROP COLUMN IF EXISTS mother_name;
ALTER TABLE customers DROP COLUMN IF EXISTS father_name;
ALTER TABLE customers DROP COLUMN IF EXISTS last_school;

-- Sonucu kontrol et
\d customers;