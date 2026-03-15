-- ================================================
-- TÜM TABLOLARI 6. SAYFA İÇİN GÜNCELLE
-- ================================================

-- RLS'i geçici kapat
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE chinese_companies DISABLE ROW LEVEL SECURITY;

-- Chinese companies tablosunu güncelle
DROP TABLE IF EXISTS chinese_companies CASCADE;

CREATE TABLE chinese_companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  inviter_name TEXT NOT NULL,
  inviter_position TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'Business partnership',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers tablosuna yeni sütunlar ekle (varsa)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_number TEXT; 
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_birth_country TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS spouse_birth_city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_nationality TEXT DEFAULT 'Türkiye';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mother_nationality TEXT DEFAULT 'Türkiye';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mother_birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0;

-- Boş değerleri güncelle
UPDATE customers SET home_address = 'Geçici adres' WHERE home_address IS NULL;
UPDATE customers SET phone_number = '+90 500 000 0000' WHERE phone_number IS NULL;
UPDATE customers SET email = 'temp@email.com' WHERE email IS NULL;
UPDATE customers SET father_name = 'Geçici' WHERE father_name IS NULL;
UPDATE customers SET father_birth_date = '1960-01-01' WHERE father_birth_date IS NULL;
UPDATE customers SET mother_name = 'Geçici' WHERE mother_name IS NULL;
UPDATE customers SET mother_birth_date = '1960-01-01' WHERE mother_birth_date IS NULL;

-- NOT NULL yap
ALTER TABLE customers ALTER COLUMN home_address SET NOT NULL;
ALTER TABLE customers ALTER COLUMN phone_number SET NOT NULL;
ALTER TABLE customers ALTER COLUMN email SET NOT NULL;
ALTER TABLE customers ALTER COLUMN father_name SET NOT NULL;
ALTER TABLE customers ALTER COLUMN father_birth_date SET NOT NULL;
ALTER TABLE customers ALTER COLUMN mother_name SET NOT NULL;
ALTER TABLE customers ALTER COLUMN mother_birth_date SET NOT NULL;
ALTER TABLE customers ALTER COLUMN children_count SET NOT NULL;

-- RLS'i tekrar aç
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chinese_companies ENABLE ROW LEVEL SECURITY;

-- Basit policy'ler
CREATE POLICY "Allow all authenticated" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all authenticated" ON chinese_companies FOR ALL USING (true);

-- Kontrol et
\d customers;
\d chinese_companies;