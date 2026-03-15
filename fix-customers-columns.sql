-- ================================================
-- CUSTOMERS TABLOSUNA EKSİK SÜTUNLARI EKLE
-- ================================================

-- Önce mevcut sütunları kontrol et
\d customers;

-- Eksik sütunları tek tek ekle
ALTER TABLE customers ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_birth_country TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_birth_city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_nationality TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mother_nationality TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mother_birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS children_count INTEGER;

-- Sonucu kontrol et
\d customers;