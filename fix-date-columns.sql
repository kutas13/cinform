-- ================================================
-- TARİH SÜTUNLARINI OPSIYONEL YAP
-- ================================================

-- Ebeveyn tarih alanlarını opsiyonel yap (zorunlu olmayabilir)
ALTER TABLE customers ALTER COLUMN father_birth_date DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN mother_birth_date DROP NOT NULL;

-- Eş alanları zaten nullable
-- spouse_birth_date zaten nullable olmalı

-- Boş string'leri NULL yap
UPDATE customers SET 
  father_birth_date = NULL WHERE father_birth_date = '0001-01-01' OR CAST(father_birth_date AS TEXT) = '';

UPDATE customers SET 
  mother_birth_date = NULL WHERE mother_birth_date = '0001-01-01' OR CAST(mother_birth_date AS TEXT) = '';

UPDATE customers SET 
  spouse_birth_date = NULL WHERE spouse_birth_date = '0001-01-01' OR CAST(spouse_birth_date AS TEXT) = '';

-- Kontrol et
\d customers;